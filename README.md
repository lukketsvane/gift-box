
## Getting Started

To run this project locally, follow these steps:

1. Clone the repository:
```

git clone [https://github.com/your-username/gift-box.git](https://github.com/your-username/gift-box.git)
cd gift-box

```plaintext

2. Install dependencies:
```

cd gift-box
npm install

```plaintext

3. Run the font pipeline (if needed):
```

python ./font_pipeline.py --mode standard

```plaintext

4. Start the development server:
```

npm run dev

```plaintext

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

## Building for Production

To create a production build:

1. Build the project:
```

npm run build

```plaintext

2. Start the production server:
```

npm start

```plaintext

## Font Pipeline

The font pipeline is a crucial part of this project, processing and preparing fonts for use in the web application.

### Running the Font Pipeline

Basic usage:
```

python font_pipeline.py --mode standard

```plaintext

Additional options:
- Debug mode: `python font_pipeline.py --mode debug`
- Custom input: `python font_pipeline.py --mode standard --input /path/to/input/fonts`
- Custom output: `python font_pipeline.py --mode standard --output /path/to/output/fonts`

### Font Pipeline Process

1. The script scans the input directory for font files.
2. Each font is processed and converted to the WOFF format.
3. Metadata for each font is generated and stored in `font_metadata.json`.
4. Processed fonts are moved to the `gift-box/public/fonts/` directory.
5. Any errors or failures are logged in `font_pipeline/logs/pipeline.log`.

## Features

- Interactive 3D gift box using React Three Fiber
- Dynamic holiday card with customizable fonts
- Snowfall effect for enhanced visual appeal
- Responsive design for various screen sizes
- Custom font pipeline for optimized font usage
- API route for font metadata

## Project Components

- `gift-box.tsx`: Main 3D gift box component with opening animation
- `card.tsx`: Holiday card component with dynamic font loading
- `font-selector.tsx`: Component for selecting and previewing different fonts
- `ground.tsx`: 3D ground plane for the gift box to rest on
- `snowfall.tsx`: Particle system for creating a snowfall effect

## Font Handling

The project uses a sophisticated font handling system:

- Fonts are stored in `gift-box/public/fonts/`
- Font metadata is managed through `gift-box/public/fonts/font_metadata.json`
- `lib/fonts.ts` provides utility functions for loading and managing fonts
- The API route in `app/api/fonts/route.ts` serves font metadata to the client

## Development Guidelines

1. Follow the Next.js 13+ App Router conventions for routing and data fetching.
2. Use React Server Components where possible to optimize performance.
3. Implement responsive design using Tailwind CSS utility classes.
4. Optimize 3D rendering performance in `gift-box.tsx` and `snowfall.tsx`.
5. Ensure accessibility in all components, especially in `card.tsx` and `font-selector.tsx`.

## Troubleshooting

- If fonts are not loading, check the `font_pipeline/logs/pipeline.log` for any processing errors.
- For 3D rendering issues, ensure all required dependencies are installed and check for WebGL support in the browser.
- If the API route is not responding, verify the `route.ts` file and check server logs for any errors.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please ensure your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
"""

    with open("README.md", "w") as readme_file:
        readme_file.write(readme_content)

    print("README.md has been generated successfully.")

if __name__ == "__main__":
    generate_readme()
```

To use this script:

1. Save it as `readme.py` in your project's root directory.
2. Run the script using Python:


```plaintext
python readme.py
```

This will generate a comprehensive README.md file in your project's root directory. The generated README includes:

1. A detailed project structure
2. Instructions for getting started and building for production
3. Information about the font pipeline and how to use it
4. A list of features and project components
5. Details about font handling in the project
6. Development guidelines and troubleshooting tips
7. Instructions for contributing to the project


You can further customize the content by editing the `readme.py` script as needed.