const PREDEFINED_GROUPS = [];

// Initialize groups on install or startup
browser.runtime.onInstalled.addListener(async () => {
    const groupsData = await browser.storage.local.get('groups');
    let groups = groupsData.groups || [];

    // If there are no groups, create the predefined ones
    if (groups.length === 0) {
        PREDEFINED_GROUPS.forEach(groupName => {
            groups.push({
                name: groupName,
                tabs: []
            });
        });
        await browser.storage.local.set({ groups: groups });
    }
});

// Ensure the groups are available on startup as well
browser.runtime.onStartup.addListener(async () => {
    const groupsData = await browser.storage.local.get('groups');
    let groups = groupsData.groups || [];

    if (groups.length === 0) {
        PREDEFINED_GROUPS.forEach(groupName => {
            groups.push({
                name: groupName,
                tabs: []
            });
        });
        await browser.storage.local.set({ groups: groups });
    }
});


// Create the right-click context menu
function createContextMenu() {
    currentMenuItems.forEach(id => browser.contextMenus.remove(id));
    currentMenuItems = [];

    // Parent: Create New Group
    const createGroupParentId = browser.contextMenus.create({
        id: "createNewGroupParent",
        title: "Create New Tab Group",
        contexts: ["tab"]
    });
    currentMenuItems.push(createGroupParentId);

    PREDEFINED_GROUPS.forEach(name => {
        const id = browser.contextMenus.create({
            id: `create_group_${name}`,
            parentId: createGroupParentId,
            title: name,
            contexts: ["tab"]
        });
        currentMenuItems.push(id);
    });

    // Parent: Add to Existing Group
    const addToGroupParentId = browser.contextMenus.create({
        id: "addToGroupParent",
        title: "Add to Tab Group",
        contexts: ["tab"]
    });
    currentMenuItems.push(addToGroupParentId);

    PREDEFINED_GROUPS.forEach(name => {
        const id = browser.contextMenus.create({
            id: `add_to_group_${name}`,
            parentId: addToGroupParentId,
            title: name,
            contexts: ["tab"]
        });
        currentMenuItems.push(id);
    });
}

// Context menu click handler
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!currentTab) return;

    const groupsData = await browser.storage.local.get('groups');
    const currentGroups = groupsData.groups || [];

    // CREATE group
    if (info.menuItemId.startsWith("create_group_")) {
        const groupName = info.menuItemId.replace("create_group_", "");
        const exists = currentGroups.find(g => g.name === groupName);

        if (!exists) {
            const newGroup = {
                name: groupName,
                tabs: [{
                    id: currentTab.id,
                    title: currentTab.title
                }]
            };
            currentGroups.push(newGroup);
            await browser.storage.local.set({ groups: currentGroups });

            await browser.tabs.update(currentTab.id, {
                title: `(${groupName}) ${currentTab.title}`
            });

            createContextMenu(); // Update menu
        }
    }

    // ADD TO group
    if (info.menuItemId.startsWith("add_to_group_")) {
        const groupName = info.menuItemId.replace("add_to_group_", "");
        const groupIndex = currentGroups.findIndex(g => g.name === groupName);
        if (groupIndex !== -1) {
            currentGroups[groupIndex].tabs.push({
                id: currentTab.id,
                title: currentTab.title
            });

            await browser.storage.local.set({ groups: currentGroups });

            await browser.tabs.update(currentTab.id, {
                title: `(${groupName}) ${currentTab.title}`
            });
        }
    }
});

// Keep titles updated if a tab changes
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.title) {
        browser.storage.local.get('groups', (result) => {
            const groups = result.groups || [];
            const updatedGroups = groups.map(group => {
                return {
                    ...group,
                    tabs: group.tabs.map(t => 
                        t.id === tabId ? { ...t, title: tab.title } : t
                    )
                };
            });
            browser.storage.local.set({ groups: updatedGroups });
        });
    }
});

// Remove tab from groups when closed
browser.tabs.onRemoved.addListener((tabId) => {
    browser.storage.local.get('groups', (result) => {
        const groups = result.groups || [];
        const updatedGroups = groups.map(group => ({
            ...group,
            tabs: group.tabs.filter(t => t.id !== tabId)
        }));
        browser.storage.local.set({ groups: updatedGroups });
    });
});
