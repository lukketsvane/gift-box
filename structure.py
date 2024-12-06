import re
from pathlib import Path
import shutil
import json
from typing import Dict, List, Set, Optional
from dataclasses import dataclass
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

@dataclass
class WebFontMetadata:
    family_name: str
    is_variable: bool
    axes: Optional[Dict[str, tuple]] = None  # Variation axes with their ranges
    formats: Set[str] = None
    file_size: int = 0

class WebFontOptimizer:
    def __init__(self, source_dir: Path, output_dir: Path):
        self.source_dir = source_dir
        self.output_dir = output_dir / "web_fonts"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.format_priority = [".woff2", ".woff"]
        self.metadata: Dict[str, WebFontMetadata] = {}

    def analyze_font(self, font_path: Path) -> Optional[WebFontMetadata]:
        try:
            with TTFont(font_path) as tt:
                family_name = tt["name"].getDebugName(1)
                is_variable = "fvar" in tt
                axes = None
                
                if is_variable:
                    axes = {
                        axis.axisTag: (axis.minValue, axis.maxValue)
                        for axis in tt["fvar"].axes
                    } if "fvar" in tt else None

                return WebFontMetadata(
                    family_name=family_name,
                    is_variable=is_variable,
                    axes=axes,
                    formats={font_path.suffix.lower()},
                    file_size=font_path.stat().st_size
                )
        except Exception as e:
            print(f"Error analyzing {font_path}: {e}")
            return None

    def optimize_fonts(self):
        """Process and organize fonts for web use"""
        for font_path in self.source_dir.glob("*.*"):
            if font_path.suffix.lower() not in {".woff2", ".woff", ".ttf", ".otf"}:
                continue

            metadata = self.analyze_font(font_path)
            if not metadata:
                continue

            # Prioritize variable fonts and WOFF2 format
            target_dir = self.output_dir / metadata.family_name
            target_dir.mkdir(exist_ok=True)

            if metadata.is_variable:
                # Variable fonts get special treatment
                self._process_variable_font(font_path, target_dir, metadata)
            else:
                # Regular fonts get converted to WOFF2 if needed
                self._process_static_font(font_path, target_dir, metadata)

        self._write_metadata()

    def _process_variable_font(self, font_path: Path, target_dir: Path, metadata: WebFontMetadata):
        """Handle variable font processing"""
        if font_path.suffix.lower() != ".woff2":
            # Convert to WOFF2 if not already
            target_path = target_dir / f"{metadata.family_name}-VF.woff2"
            self._convert_to_woff2(font_path, target_path)
        else:
            # Copy WOFF2 directly
            target_path = target_dir / f"{metadata.family_name}-VF.woff2"
            shutil.copy2(font_path, target_path)

        metadata.file_size = target_path.stat().st_size
        self.metadata[metadata.family_name] = metadata

    def _process_static_font(self, font_path: Path, target_dir: Path, metadata: WebFontMetadata):
        """Handle static font processing"""
        target_path = target_dir / f"{font_path.stem}.woff2"
        self._convert_to_woff2(font_path, target_path)
        metadata.file_size = target_path.stat().st_size
        self.metadata[metadata.family_name] = metadata

    def _convert_to_woff2(self, source: Path, target: Path):
        """Convert font to WOFF2 format"""
        # Implementation would use fontTools for conversion
        # This is a placeholder for the actual conversion logic
        pass

    def _write_metadata(self):
        """Save font metadata as JSON"""
        with open(self.output_dir / "web_fonts.json", "w") as f:
            json.dump(
                {name: asdict(meta) for name, meta in self.metadata.items()},
                f, indent=2, default=list
            )

def main():
    optimizer = WebFontOptimizer(
        source_dir=Path("font_pipeline/processed"),
        output_dir=Path("font_pipeline/web_ready")
    )
    optimizer.optimize_fonts()

if __name__ == "__main__":
    main()
