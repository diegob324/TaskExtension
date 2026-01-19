//handles alarm notifications, triggers if a task is incomplete
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(["tasks"], ({ tasks = [] }) => {
    const task = tasks.find(t => t.id === alarm.name);
    if (task && !task.done) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Task Reminder",
        message: task.text
      });
    }
  });
});