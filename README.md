# PubConnector


**PubConnector** is a Chrome extension designed to streamline research by linking publications from multiple platforms. With PubConnector, you can view publications in [Zotero](https://www.zotero.org) and [TiddlyWiki](https://tiddlywiki.com) directly from your web browser.  

## Motivation  

I have been using [Zotero](https://www.zotero.org/) and [Refnotes](https://kookma.github.io/TW-Refnotes/) in [TiddlyWiki](https://tiddlywiki.com/) to manage my references. However, when searching for and reading new literature online, I often encounter the following challenges:  

- **Keeping track of existing literature**: It's not always easy to remember which references are already stored in [Zotero](https://www.zotero.org/) and [TiddlyWiki](https://tiddlywiki.com/).  
- **Cross-platform searching**: Searching for the same literature across platforms like [Scopus](https://www.scopus.com/) and [Google Scholar](https://scholar.google.com/) can be tedious.  
- **Linking back to TiddlyWiki**: Navigating back to specific notes or tiddlers in [TiddlyWiki](https://tiddlywiki.com/) is not always straightforward.  

This Chrome extension is designed to address these issues, streamlining the research process and improving efficiency.  

## Features:  
- Access your [Zotero](https://www.zotero.org) items and open associated PDF files.  
- Navigate to specific [TiddlyWiki](https://tiddlywiki.com) tiddlers for organized research notes.  
- Link to scholarly resources, including [Scopus](https://www.scopus.com), [Google Scholar](https://scholar.google.com), publishers, and more.  

## Prerequisites  

Before using **PubConnector**, ensure that your TiddlyWiki and Zotero are properly configured to support integration with the extension. 

### TiddlyWiki  

1. **Run TiddlyWiki in Node.js Mode**:  
   - **PubConnector** uses the TiddlyWiki [WebAPI](https://tiddlywiki.com/static/WebServer%2520API.html) to access publications stored in TiddlyWiki.  
   - Install [Node.js](https://nodejs.org/) if it is not already installed.  
   - Set up TiddlyWiki in Node.js mode by following the [official guide](https://tiddlywiki.com/#Installing%20TiddlyWiki%20on%20Node.js).  

2. **Install the TW-Connector Plugin**:  
   - Install the [TW-Connector](https://github.com/byzheng/TW-Connector) plugin, a small TiddlyWiki extension that allows opening tiddlers from other tabs in the web browser.  
   - Follow the instructions provided in the [TW-Connector repository](https://github.com/byzheng/TW-Connector) to install the plugin.  

3. **Data Structure**  
   **PubConnector** utilizes information stored in TiddlyWiki to render on web pages:

   - Tiddlers with the tag `Colleague` are used for researcher information, including fields like `scopus`, `orcid`, and `google-scholar` for profile links on [Scopus](https://www.scopus.com), [ORCID](https://orcid.org/), and [Google Scholar](https://scholar.google.com).
   
   - Tiddlers with the tag `bibtex-entry` (imported via [Refnotes](https://kookma.github.io/TW-Refnotes/)) are used for publications, including fields like:  
     - `scopus-eid` for the Scopus identifier,  
     - `scholar-cid` and `scholar-cites` for the Google Scholar identifier (which might not always be accurate).  
     
     These fields can be programmatically retrieved using [R scripts](https://rpubconnector.bangyou.me/).

### Zotero  

1. **Enable Third-Party API Access**:  
   - Open Zotero and go to **Settings > Advanced.  
   - Enable `Allow other application on this computer to communicate with Zotero`.  

After completing these prerequisites, **PubConnector** will be ready to link your references across TiddlyWiki, Zotero, and other platforms.  

## Features

**PubConnector** renders a banner at the top right corner of webpages depending on domains. The icons depend on whether TiddlyWiki and Zotero Servers are available.

### **Publisher website**

In any pages which can find an **DOI**.


* A link back to TiddlyWiki and open tiddler with tag `bibtex-entry` by matching **DOI** in field `bibtex-doi`
* A link to [Google Scholar](https://scholar.google.com) by searching **DOI**
* A link to [Scopus](https://scopus.com) by
  * opening **eid** if `scopus-eid` is available in TiddlyWiki
  * or by searching **DOI** if `scopus-eid` is not available in TiddlyWiki
* A icon **Reading** if tag `Reading` is in the tiddler 
* A link to open Zotero Item by matching **DOI**
* A link to open first PDF file in a Zotero Item  by matching **DOI**
* links above author list back to TiddlyWiki for all tags with tag `Colleague`, `Domain` and `Place`


<img width="336" alt="image" src="https://github.com/user-attachments/assets/bb964b84-1630-473d-bb99-fc7c8349e600">


### scopus.com

In author profile page with **authorId** in url

* A link back to Tiddlywiki and open tiddler with tag `Colleague` by matching field **authorId** in field `scopus` 
* A link to Google Scholar author profile by looking for field `google-scholar` if available in the tiddler 
* A link to ORCID author profile by looking for field `orcid` if available in the tiddler

<img width="336" alt="image" src="https://github.com/user-attachments/assets/48e6099d-0154-4c42-bd19-bdd0ff5669a2">


In publication page with **eid** in url

* A link back to TiddlyWiki and open tiddler with tag `bibtex-entry` by matching **DOI** in field `scopus-eid`
* A link to [Google Scholar](https://scholar.google.com) by searching **DOI**
* A icon **Reading** if tag `Reading` is in the tiddler 
* A link to open Zotero Item by matching **DOI**
* A link to open first PDF file in a Zotero Item  by matching **DOI**
* links above author list back to TiddlyWiki for all tags with tag `Colleague`, `Domain` and `Place`

In all pages with item lists, e.g. author profile, search, reference and citation, any items with matching **eid** in field `scopus-eid`
will be highlighed with an icon link back to Tiddlywiki. 

<img width="550" alt="image" src="https://github.com/user-attachments/assets/6888a334-c55e-4454-8206-7d9c21d725aa">

### scholar.google.com

In author profile page with **user** in url,

* A link back to Tiddlywiki and open tiddler with tag `Colleague` by matching field **authorId** in field `scopus` 
* A link to Scopus author profile by looking for field `scopus` if available in the tiddler 
* A link to ORCID author profile by looking for field `orcid` if available in the tiddler

In all pages with item lists, e.g. author profile, search and citation, any items with matching **cid** or **cites** in field `scholar-cid` 
or `scholar-cites`, respetively will be highlighed with an icon link back to Tiddlywiki. 

## Installation

### Install from Source Code (Latest Version)

Follow these steps to install the extension directly from the source code:

1. **Clone the Repository**
   - Use Git to clone the repository:
     ```bash
     git clone https://github.com/byzheng/PubConnector.git
     ```
   - Alternatively, download the repository as a `.zip` file from the [main branch](https://github.com/byzheng/PubConnector) and extract it.

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

If you encounter any issues, feel free to report them in the [Issues](https://github.com/byzheng/PubConnector/issues) section.


## Contributing

Contributions are welcome! Please submit a pull request or raise an issue if you have ideas for improvements or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).


## Third-Party Resources and Licenses

### Icons

The icons used in this project are stored in the `/images` folder. Please refer to the [LICENSES.md](images/LICENSES.md) file in the `/images` folder for detailed licensing information about the third-party icons used in this project.
