# tw-research

This is a Chrome Extension to link colleagues and references in several publication websites, including [Scopus](https://www.scopus.com/), [Google Scholar](https://scholar.google.com/), and [ResearchGate](https://www.researchgate.net/), to a [Node.js](https://tiddlywiki.com/static/Installing%2520TiddlyWiki%2520on%2520Node.js.html)-based [TiddlyWiki](https://tiddlywiki.com/).

## Motivation

I have been using [Zotero](https://www.zotero.org/) and [Refnotes](https://kookma.github.io/TW-Refnotes/) in [TiddlyWiki](https://tiddlywiki.com/) to manage my references. When I search and read new literature online, it is not always easy to:

- Remember which literature already exists in [Zotero](https://www.zotero.org/) and [TiddlyWiki](https://tiddlywiki.com/).
- Search the same literature across platforms (e.g., [Scopus](https://www.scopus.com/), [Google Scholar](https://scholar.google.com/)).
- Link back to [TiddlyWiki](https://tiddlywiki.com/).

This Chrome extension is designed to ease these problems.

## Installation

### Install from Source Code (Latest Version)

Follow these steps to install the extension directly from the source code:

1. **Clone the Repository**
   - Use Git to clone the repository:
     ```bash
     git clone https://github.com/your-username/tw-research.git
     ```
   - Alternatively, download the repository as a `.zip` file from the [main branch](https://github.com/your-username/tw-research) and extract it.

2. **Open Chrome Extensions Page**
   - In Chrome, navigate to `chrome://extensions/`.

3. **Enable Developer Mode**
   - Toggle the **Developer mode** switch in the top-right corner of the page.

4. **Load the Extension**
   - Click **Load unpacked**.
   - In the file dialog, select the folder containing the extension’s source code (the folder with `manifest.json`).

5. **Use the Extension**
   - The extension will now be installed and ready to use.
   - Any updates you make to the source code will automatically reflect after refreshing the browser (if necessary).

---

If you encounter any issues, feel free to report them in the [Issues](https://github.com/your-username/tw-research/issues) section.


## TiddlyWiki

## Features

Show toolbar over webpage with DOI in the TiddlyWiki
  * show Tiddlywiki icon in Google Scholar
  * show Tiddlywiki icon in Scopus for paper page, citation list, search result
  * show authors for publications in the Tiddlywiki
  * link back to authors and publications in Tiddlywiki



## Contributing

Contributions are welcome! Please submit a pull request or raise an issue if you have ideas for improvements or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).


## Third-Party Resources and Licenses

### Icons

The icons used in this project are stored in the `/images` folder. Please refer to the [LICENSES.md](images/LICENSES.md) file in the `/images` folder for detailed licensing information about the third-party icons used in this project.
