document.addEventListener("DOMContentLoaded", function () {
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");

    tabLinks.forEach((tab) => {
        tab.addEventListener("click", function () {
            // Remove active class from all buttons
            tabLinks.forEach((btn) => btn.classList.remove("active"));

            // Hide all tab contents
            tabContents.forEach((content) => content.classList.remove("active"));

            // Activate the clicked tab
            this.classList.add("active");
            document.getElementById(this.dataset.tab).classList.add("active");
        });
    });

    // Automatically analyze the current page on extension open
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractSEOData
        }, (results) => {
            if (results && results[0] && results[0].result) {
                let data = results[0].result;

                document.getElementById("title").innerText = data.title;
                document.getElementById("description").innerText = data.description;

                displayHeadings("h1", data.h1);
                displayHeadings("h2", data.h2);
                displayHeadings("h3", data.h3);

                document.getElementById("gtm").innerText = data.trackingTags.GTM !== "Not Found"
                    ? `✅ ${data.trackingTags.GTM}` : "❌ Not Found";
                document.getElementById("ga4").innerText = data.trackingTags.GA4 !== "Not Found"
                    ? `✅ ${data.trackingTags.GA4}` : "❌ Not Found";
                document.getElementById("msClarity").innerText = data.trackingTags.MSClarity !== "Not Found"
                    ? `✅ ${data.trackingTags.MSClarity}` : "❌ Not Found";
            }
        });
    });
});

// Function to display headings in bullet points
function displayHeadings(tag, headings) {
    const container = document.getElementById(tag);
    const countElement = document.getElementById(tag.toUpperCase() + "Count");

    container.innerHTML = ""; // Clear previous content
    countElement.innerText = headings.length; // Update count

    if (headings.length > 0) {
        let ul = document.createElement("ul");
        headings.forEach(text => {
            let li = document.createElement("li");
            li.textContent = text;
            ul.appendChild(li);
        });
        container.appendChild(ul);
    } else {
        container.innerText = `No ${tag.toUpperCase()} found`;
    }
}

// Function to extract SEO details from the webpage
function extractSEOData() {
    let title = document.querySelector("title")?.innerText || "Not Found";
    let description = document.querySelector("meta[name='description']")?.content || "Not Found";
    let headings = (tag) => [...document.querySelectorAll(tag)].map(el => el.innerText.trim()).filter(text => text);

    let trackingTags = {
        GTM: "Not Found",
        GA4: "Not Found",
        MSClarity: "Not Found"
    };

    // Find all script tags
    let scripts = document.querySelectorAll("script");

    scripts.forEach(script => {
        let scriptContent = script.innerText || script.src;

        // Check for GTM
        if (scriptContent.includes("googletagmanager.com/gtm.js?id=")) {
            let match = scriptContent.match(/GTM-[A-Z0-9]+/);
            if (match) trackingTags.GTM = match[0];
        }

        // Check for GA4
        if (scriptContent.includes("gtag('config'")) {
            let match = scriptContent.match(/G-[A-Z0-9]+/);
            if (match) trackingTags.GA4 = match[0];
        }

        // Check for MS Clarity
        if (scriptContent.includes("clarity.ms/tag/")) {
            let match = scriptContent.match(/clarity\.ms\/tag\/([a-z0-9]+)/i);
            if (match) trackingTags.MSClarity = match[1];  // Extract ID
        }
    });

    return {
        title,
        description,
        h1: headings("h1"),
        h2: headings("h2"),
        h3: headings("h3"),
        trackingTags
    };
}
