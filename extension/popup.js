document.getElementById("analyze-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractSEOData
        }, (results) => {
            if (results && results[0] && results[0].result) {
                let data = results[0].result;

                document.getElementById("title").innerText = data.title;
                document.getElementById("description").innerText = data.description;
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



// Function to extract SEO details (runs inside the webpage)
function extractSEOData() {
    let title = document.querySelector("title")?.innerText || "Not Found";
    let description = document.querySelector("meta[name='description']")?.content || "Not Found";

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

    return { title, description, trackingTags };
}


// Listen for results and update UI
chrome.runtime.onMessage.addListener((message) => {
    document.getElementById("title").textContent = message.title;
    document.getElementById("description").textContent = message.description;

    let tagsList = document.getElementById("tags");
    tagsList.innerHTML = "";
    if (message.detectedTags.length > 0) {
        message.detectedTags.forEach((tag) => {
            let li = document.createElement("li");
            li.textContent = tag;
            tagsList.appendChild(li);
        });
    } else {
        tagsList.innerHTML = "<li>No tracking tags found</li>";
    }
});
