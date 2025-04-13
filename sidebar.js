document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
});

// Re-render the sidebar from storage and tab info
async function renderSidebar() {
  const groupsData = await browser.storage.local.get("groups");
  const groups = groupsData.groups || [];

  const allTabs = await browser.tabs.query({ currentWindow: true });

  const groupedTabIds = groups.flatMap((group) => group.tabs.map((t) => t.id));
  const openTabs = allTabs.filter((tab) => !groupedTabIds.includes(tab.id));

  renderGroups(groups);
  renderOpenTabs(openTabs);
}

// Display tab groups and their tabs
function renderGroups(groups) {
  const container = document.getElementById("tab-groups-container");
  container.innerHTML = "";

  groups.forEach((group, idx) => {
    const color = group.color || "#4682B4"; // fallback color

    // Create group label
    const groupLabel = document.createElement("div");
    groupLabel.className = "group-label";
    groupLabel.style.color = color;
    groupLabel.style.cursor = "pointer";

    // Expand/Collapse text
    const labelText = document.createElement("span");
    labelText.textContent = `${group.tabs.length > 0 ? "▼" : ""} ${group.name}`;
    groupLabel.appendChild(labelText);

    // Delete and Close Tabs button
    const deleteAndCloseBtn = document.createElement("span");
    deleteAndCloseBtn.textContent = "🔥";
    deleteAndCloseBtn.style.marginLeft = "10px";
    deleteAndCloseBtn.style.cursor = "pointer";
    deleteAndCloseBtn.style.color = "#c0392b";
    deleteAndCloseBtn.title = "Delete Group & Close Tabs";
    deleteAndCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (
        confirm(`Are you sure you want to delete the group "${group.name}" and close the tabs?`)
      ) {
        deleteGroupAndCloseTabs(group.name);
      }
    });
    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = "➖";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.color = "#c0392b";
    deleteBtn.title = "Delete Group Only (Keep Tabs)";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (
        confirm(`Are you sure you want to delete the group "${group.name}"?`)
      ) {
        deleteGroup(group.name);
      }
    });
    groupLabel.appendChild(deleteBtn);
    groupLabel.appendChild(deleteAndCloseBtn);

    // Create container for tabs
    const tabListWrapper = document.createElement("div");
    tabListWrapper.className = "tab-list-wrapper";

    // Create actual list of tabs
    const tabList = document.createElement("ul");
    group.tabs.forEach((tab) => {
      const tabItem = document.createElement("li");
      tabItem.className = "tab-item";
      tabItem.style.display = "flex";
      tabItem.style.alignItems = "center";
      tabItem.style.gap = "8px";

      // Create favicon image
      const favicon = document.createElement("img");
      favicon.src = tab.favIconUrl || "default-icon.png";
      favicon.className = "tab-favicon";
      favicon.style.width = "16px";
      favicon.style.height = "16px";

      // Create span for title
      const titleSpan = document.createElement("span");
      titleSpan.textContent = tab.title;
      titleSpan.style.flex = "1";
      titleSpan.style.whiteSpace = "nowrap";
      titleSpan.style.overflow = "hidden";
      titleSpan.style.textOverflow = "ellipsis";

      // Delete icon
      const deleteIcon = document.createElement("span");
      deleteIcon.textContent = "❌";
      deleteIcon.className = "delete-icon";
      deleteIcon.title = "Close tab";
      deleteIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        browser.tabs.remove(tab.id).then(() => {
          renderSidebar(); // Refresh the sidebar
        });
      });

      // Add click event
      tabItem.addEventListener("click", () => {
        browser.tabs.update(tab.id, { active: true });
      });

      // Append favicon and title
      tabItem.appendChild(deleteIcon);
      tabItem.appendChild(favicon);
      tabItem.appendChild(titleSpan);
      tabList.appendChild(tabItem);
    });

    tabListWrapper.appendChild(tabList);
    container.appendChild(groupLabel);
    container.appendChild(tabListWrapper);

    // Set initial collapsed state
    if (group.tabs.length > 0) {
      let isExpanded = true;
      groupLabel.addEventListener("click", () => {
        isExpanded = !isExpanded;
        tabListWrapper.style.display = isExpanded ? "block" : "none";
        groupLabel.textContent = `${isExpanded ? "▼" : "▶"} ${group.name}`;
      });
    }
  });
}

// Display open (unassigned) tabs
// Display open (unassigned) tabs
function renderOpenTabs(tabs) {
  const openList = document.getElementById("open-tabs-list");
  openList.innerHTML = "";

  tabs.forEach((tab) => {
    const item = document.createElement("li");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "10px"; // Add space between elements
    item.style.transition = "background-color 0.2s";

    // Create delete (❌) icon
    const deleteIcon = document.createElement("span");
    deleteIcon.textContent = "❌";
    deleteIcon.className = "delete-icon";
    deleteIcon.title = "Close tab";
    deleteIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // Avoid triggering group assignment
      browser.tabs.remove(tab.id).then(() => {
        renderSidebar(); // Refresh view
      });
    });

    // Create favicon image
    const favicon = document.createElement("img");
    favicon.src = tab.favIconUrl || "default-icon.png"; // fallback if no favicon
    favicon.className = "tab-favicon";
    favicon.style.width = "16px";
    favicon.style.height = "16px";

    // Create a span for the title
    const titleSpan = document.createElement("span");
    titleSpan.textContent = tab.title;
    titleSpan.style.flex = "1"; // Make title take remaining space
    titleSpan.style.whiteSpace = "nowrap";
    titleSpan.style.overflow = "hidden";
    titleSpan.style.textOverflow = "ellipsis";

    // Create a dropdown menu for groups
    const dropdown = document.createElement("select");
    dropdown.style.padding = "4px 8px";
    dropdown.style.borderRadius = "6px";
    dropdown.style.color = "#000";
    dropdown.style.fontSize = "14px";
    dropdown.style.cursor = "pointer";
    dropdown.style.margin = "5px 0";
    dropdown.style.transition = "all 0.3s ease";
    dropdown.style.appearance = "none";
    dropdown.style.mozAppearance = "none";
    dropdown.style.backgroundRepeat = "no-repeat";
    dropdown.style.backgroundPosition = "right 12px center";
    dropdown.style.backgroundSize = "16px";
    // dropdown.style.width = "150px";

    // Add a placeholder option
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "ADD";
    dropdown.appendChild(placeholderOption);

    // Add existing groups as options
    browser.storage.local.get("groups").then((result) => {
      const groups = result.groups || [];
      groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.name;
        option.textContent = group.name;
        dropdown.appendChild(option);
      });
    });

    // Add elements to item
    item.appendChild(deleteIcon);
    item.appendChild(favicon);
    item.appendChild(titleSpan);
    item.appendChild(dropdown);

    // Add click handler
    item.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent list item click
      const selectedGroup = dropdown.value;
      if (selectedGroup) {
        await assignTabToGroup(tab, selectedGroup);
        renderSidebar();
      }
    });

    openList.appendChild(item);
  });
}

// Assign a tab to a group
async function assignTabToGroup(tab, groupName) {
  const groupsData = await browser.storage.local.get("groups");
  const groups = groupsData.groups || [];

  const group = groups.find((g) => g.name === groupName);
  if (!group) {
    alert("Group not found");
    return;
  }

  // Prevent duplicate tab entries
  if (group.tabs.some((t) => t.id === tab.id)) {
    alert("Tab already in this group");
    return;
  }

  group.tabs.push({ id: tab.id, title: tab.title, favIconUrl: tab.favIconUrl, url: tab.url });
  await browser.storage.local.set({ groups });
}

async function deleteGroup(groupName) {
    const result = await browser.storage.local.get("groups");
    const updatedGroups = (result.groups || []).filter(
      (group) => group.name !== groupName
    );
    await browser.storage.local.set({ groups: updatedGroups });
    renderSidebar();
  }
  

async function deleteGroupAndCloseTabs(groupName) {
  const result = await browser.storage.local.get("groups");
  const groups = result.groups || [];

  const groupToDelete = groups.find((group) => group.name === groupName);

  if (groupToDelete && groupToDelete.tabs.length > 0) {
    const tabIds = groupToDelete.tabs.map((tab) => tab.id);

    try {
      await browser.tabs.remove(tabIds); // Close all tabs
    } catch (error) {
      console.warn("Some tabs might already be closed or unavailable.");
    }
  }

  const updatedGroups = groups.filter((group) => group.name !== groupName);
  await browser.storage.local.set({ groups: updatedGroups });

  renderSidebar();
}

// Watch for tab creation, removal, or updates
browser.tabs.onCreated.addListener(() => {
  renderSidebar();
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Step 1: Load current groups
  const result = await browser.storage.local.get("groups");
  const groups = result.groups || [];

  // Step 2: Remove the closed tab from any group
  const updatedGroups = groups.map((group) => ({
    ...group,
    tabs: group.tabs.filter((t) => t.id !== tabId),
  }));

  // Step 3: Save back updated groups
  await browser.storage.local.set({ groups: updatedGroups });

  // Step 4: Re-render the sidebar with a slight delay
  setTimeout(() => {
    renderSidebar();
  }, 100);
});

browser.tabs.onUpdated.addListener(() => {
  renderSidebar();
});

// Optional: Watch storage changes (if tabs get added/removed from group via background)
browser.storage.onChanged.addListener(() => {
  renderSidebar();
});

document
  .getElementById("create-group-btn")
  .addEventListener("click", async () => {
    const input = document.getElementById("new-group-name");
    const groupName = input.value.trim();

    if (!groupName) return;

    const stored = await browser.storage.local.get("groups");
    const groups = stored.groups || [];

    if (groups.some((g) => g.name === groupName)) {
      alert("Group already exists!");
      return;
    }

    groups.push({
      name: groupName,
      color: selectedColor,
      tabs: [],
    });

    await browser.storage.local.set({ groups });

    input.value = "";
    renderSidebar();
  });

document
  .getElementById("toggle-create-group")
  .addEventListener("click", (e) => {
    const container = document.getElementById("group-create-container");
    const expandIcon = document.getElementById("expand-icon");

    // Only toggle when button-top or expand-icon is clicked
    if (
      e.target.classList.contains("button-top") ||
      e.target.id === "expand-icon"
    ) {
      const isVisible = container.style.display === "block";
      container.style.display = isVisible ? "none" : "block";
      expandIcon.textContent = isVisible ? "▼" : "▲";
    }
  });
  
