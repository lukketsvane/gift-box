import asyncio
import aiohttp
import aiofiles
import multiprocessing as mp
import time
import magic
from pathlib import Path
import json
import zipfile
import py7zr
import rarfile
import shutil
import tempfile
import logging
import psutil
import platform
import argparse
import re
from rich.console import Console
from rich.logging import RichHandler
from rich.panel import Panel
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Set, List, Optional
from fontTools.ttLib import TTFont

console = Console()


class PipelineMode(Enum):
    DEBUG = "debug"
    STANDARD = "standard"
    TURBO = "turbo"


@dataclass(eq=True, frozen=True)
class FontData:
    family: str
    style: str
    file_format: str
    is_variable: bool
    axes: Optional[Dict] = None
    original_size: int = 0
    optimized_size: int = 0

    def __hash__(self):
        return hash((self.family, self.style, self.file_format, self.is_variable, tuple(self.axes.items()) if self.axes else None, self.original_size, self.optimized_size))


@dataclass
class PipelineConfig:
    mode: PipelineMode
    batch_size: int
    max_retries: int
    concurrent_downloads: int
    concurrent_extractions: int
    chunk_size: int = 8192


class FontPipeline:
    def __init__(self, mode: PipelineMode = PipelineMode.STANDARD, gift_box_dir: Path = Path("/workspaces/gift-box/gift-box")):
        self.config = PipelineConfig(mode=mode, batch_size=25, max_retries=3, concurrent_downloads=30, concurrent_extractions=mp.cpu_count(), chunk_size=8192)
        self.dirs = {k: Path(f"font_pipeline/{k}") for k in ['temp', 'failed', 'logs', 'processed_fonts']}
        [p.mkdir(parents=True, exist_ok=True) for p in self.dirs.values()]
        self.public_fonts_dir = gift_box_dir / "public" / "fonts"
        self.public_fonts_dir.mkdir(parents=True, exist_ok=True)
        logging.basicConfig(level=logging.INFO, format="%(message)s", handlers=[RichHandler(console=console), logging.FileHandler(self.dirs['logs'] / "pipeline.log")])
        self.logger = logging.getLogger("FontPipeline")
        self.stats = {'processed': 0, 'optimized': 0, 'failed': 0, 'start_time': time.time()}
        self.metadata = {}
        self.download_sem = asyncio.Semaphore(self.config.concurrent_downloads)
        self.mime = magic.Magic(mime=True)
        self.service_key = "21eabbe521eabbe521eabbe5a722cf56bb221ea21eabbe546b9e888b3601c4922e99a52"

    async def validate_download(self, path: Path, expected_size: int) -> bool:
        if not path.exists():
            return False
        try:
            actual_size = path.stat().st_size
            if expected_size and abs(actual_size - expected_size) > 100:
                return False
            mime_type = self.mime.from_file(str(path))
            return mime_type in ['application/x-7z-compressed', 'application/zip', 'application/x-rar', 'application/octet-stream']
        except Exception as e:
            self.logger.error(f"Download validation error: {e}")
            return False

    async def download_with_retry(self, url: str, path: Path) -> Optional[Path]:
        for attempt in range(self.config.max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        if response.status == 200:
                            expected_size = int(response.headers.get('content-length', 0))
                            async with aiofiles.open(path, 'wb') as f:
                                chunks = response.content.iter_chunked(self.config.chunk_size)
                                async for chunk in chunks:
                                    await f.write(chunk)
                            if await self.validate_download(path, expected_size):
                                return path
            except Exception as e:
                self.logger.error(f"Download attempt {attempt+1} failed: {e}")
            await asyncio.sleep(1 * (attempt + 1))
        self.logger.error(f"Failed to download after {self.config.max_retries} attempts: {url}")
        return None

    async def process_font(self, path: Path) -> Optional[FontData]:
        try:
            with TTFont(path) as tt:
                family = tt["name"].getDebugName(1) or path.stem
                style = path.stem.split('-')[-1].lower()
                format = path.suffix.lower()
                is_variable = "fvar" in tt
                axes = {axis.axisTag: (axis.minValue, axis.maxValue) for axis in tt["fvar"].axes} if is_variable else None
                metadata = FontData(family=family, style=style, file_format=format, is_variable=is_variable, axes=axes, original_size=path.stat().st_size)
                if format in {'.woff2', '.woff', '.ttf'}:
                    format_dir = self.dirs['processed_fonts'] / format[1:]
                    family_dir = format_dir / family
                    family_dir.mkdir(parents=True, exist_ok=True)
                    style_file = f"{family}-{style}{format}"
                    target_path = family_dir / style_file
                    shutil.copy2(path, target_path)
                    metadata.optimized_size = target_path.stat().st_size
                    if format == '.woff':
                        public_family_dir = self.public_fonts_dir / family
                        public_family_dir.mkdir(exist_ok=True)
                        public_style_file = f"{family}-{style}{format}"
                        public_target_path = public_family_dir / public_style_file
                        shutil.copy2(target_path, public_target_path)
                    return metadata
        except Exception as e:
            self.logger.error(f"Font processing error: {e}")
        return None

    async def extract_and_process(self, archive_path: Path) -> Set[FontData]:
        processed = set()
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            try:
                if archive_path.suffix.lower() == '.zip':
                    zipfile.ZipFile(archive_path, 'r').extractall(temp_path)
                elif archive_path.suffix.lower() == '.7z':
                    py7zr.SevenZipFile(archive_path, 'r').extractall(temp_path)
                elif archive_path.suffix.lower() == '.rar':
                    rarfile.RarFile(archive_path, 'r').extractall(temp_path)
                for font_path in temp_path.rglob("*"):
                    if font_path.suffix.lower() in {'.woff2', '.woff', '.ttf'}:
                        try:
                            if metadata := await self.process_font(font_path):
                                processed.add(metadata)
                        except Exception as e:
                            self.logger.error(f"Font processing error: {e}")
                    else:
                        self.logger.info(f"Skipping unsupported font file: {font_path}")
            except Exception as e:
                self.logger.error(f"Extraction error: {e}")
            finally:
                archive_path.unlink(missing_ok=True)
        return processed

    async def process_document(self, doc: Dict) -> Optional[Set[FontData]]:
        async with self.download_sem:
            temp_path = self.dirs['temp'] / f"temp_{doc['title'].encode('ascii', 'ignore').decode()}"
            if downloaded_path := await self.download_with_retry(doc['url'], temp_path):
                return await self.extract_and_process(downloaded_path)
        return None

    async def run(self):
        self.logger.info(f"Starting pipeline in {self.config.mode.value} mode")
        offset = 0
        try:
            while True:
                async with aiohttp.ClientSession() as session:
                    async with session.post("https://api.vk.com/method/board.getComments", data={"group_id": 178186634, "topic_id": 39300099, "offset": offset, "count": self.config.batch_size, "access_token": self.service_key, "v": "5.131"}) as response:
                        data = await response.json()
                        docs = [a["doc"] for i in data.get("response", {}).get("items", []) for a in i.get("attachments", []) if a["type"] == "doc"]
                        if not docs:
                            break
                        results = await asyncio.gather(*[self.process_document(doc) for doc in docs])
                        processed_fonts = [m for r in results if r for m in r]
                        skipped_failed = len(docs) - len(processed_fonts)
                        self.stats['processed'] += len(processed_fonts)
                        self.metadata.update({f"{font.family}|{font.style}|{font.file_format}": font for font in processed_fonts})
                        self.save_metadata()
                        self.logger.info(f"Batch {offset//self.config.batch_size}: Processed {len(processed_fonts)}, Skipped/Failed {skipped_failed}")
                        offset += self.config.batch_size
        except Exception as e:
            self.logger.error(f"Error during pipeline run: {e}")
        finally:
            await self.cleanup()
            self.print_summary()

    def save_metadata(self):
        pipeline_metadata_file = self.dirs['processed_fonts'] / "font_metadata.json"
        public_metadata_file = self.public_fonts_dir / "font_metadata.json"
        pipeline_existing_metadata = json.load(open(pipeline_metadata_file, "r")) if pipeline_metadata_file.exists() else {}
        public_existing_metadata = json.load(open(public_metadata_file, "r")) if public_metadata_file.exists() else {}
        pipeline_existing_metadata.update({k: vars(v) for k, v in self.metadata.items() if k not in pipeline_existing_metadata})
        json.dump(pipeline_existing_metadata, open(pipeline_metadata_file, "w"), indent=2, default=str)
        public_existing_metadata.update({k: vars(v) for k, v in self.metadata.items() if v.file_format == '.woff' and k not in public_existing_metadata})
        json.dump(public_existing_metadata, open(public_metadata_file, "w"), indent=2, default=str)

    async def cleanup(self):
        shutil.rmtree(self.dirs['temp'], ignore_errors=True)

    def print_summary(self):
        elapsed = time.time() - self.stats['start_time']
        console.print(Panel("\n".join([f"[green]Processed: {self.stats['processed']}", f"[blue]Optimized: {self.stats['optimized']}", f"[red]Failed: {self.stats['failed']}", f"[cyan]Total Time: {elapsed:.2f}s", f"[magenta]Processing Rate: {self.stats['processed']/elapsed:.2f} fonts/sec"]), title="[bold]Pipeline Summary")
)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["debug", "standard", "turbo"], default="standard")
    args = parser.parse_args()
    asyncio.run(FontPipeline(mode=PipelineMode[args.mode.upper()]).run())