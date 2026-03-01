getAndRenderTags();
getAndRenderLogs();

function getAndRenderTags() {
  chrome.storage.local.get(["bannedContext"], (result) => {
    if (!result) return;

    bannedContext.forEach((context) => {
      renderTag(context);
    });
  });
}

const tagsContainer = document.getElementById("words-list");
function renderTag(tagText) {
  const tagHtml = `
  <span class="tag-text" dir="auto"></span>
  <span class="delete" id="delete">X</span>
  `;

  let element = document.createElement("div");

  element.innerHTML = tagHtml;
  element.classList.add("tag");

  element.setAttribute("title", tagText);
  element.querySelector(".tag-text").textContent = tagText;

  tagsContainer.appendChild(element);
}

function getAndRenderLogs() {}
