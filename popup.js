const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const taskTime = document.getElementById("taskTime");

//loading tasks from local storage
chrome.storage.local.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    tasks.forEach(task => {
        addTaskToUI(task);

        if (task.time && !task.done) {
            const now = new Date();
            const [h, m] = task.time.split(":");
            const alarmTime = new Date();
            alarmTime.setHours(h, m, 0, 0);

            if (alarmTime > now) {
                chrome.alarms.create(task.id, {
                    when: alarmTime.getTime()
                });
            }
        }
    });
});


//adding tasks
addTaskButton.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const time = taskTime.value.trim();

    //check if text exists
    if(!text) return;
    const task = {id: crypto.randomUUID(), text, time, done: false};

    //get tasks array to push, and sort
    chrome.storage.local.get(["tasks"], (result) => {
        let tasks = result.tasks || [];
        tasks.push(task);

        tasks.sort((a, b) => {
            if(a.done && !b.done) {return 1;}
            else if (!a.done && b.done) {return -1;}
            else if(!a.time) {return 1;}
            else if (!b.time) {return -1;}
            return a.time.localeCompare(b.time);
        });

        chrome.storage.local.set({ tasks }, () => {
        taskList.innerHTML = '';
        tasks.forEach(addTaskToUI);

        //creating an alarm for the task
        if (task.time) {
            const now = new Date();
            const [hours, minutes] = task.time.split(":");

            const alarmTime = new Date();
            alarmTime.setHours(hours, minutes, 0, 0);

            //if time already passed today, schedules for tomorrow
            if (alarmTime <= now) {
                alarmTime.setDate(alarmTime.getDate() + 1);
            }

            chrome.alarms.create(task.id, {
                when: alarmTime.getTime()
            });
    }
});
  });

    //clear input field
    taskInput.value = "";
    taskTime.value = "";

});

//adds tasks to list
function addTaskToUI(task){
    //create new list item, and set its contents to text
    if (task.done === undefined) task.done = false;
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.textContent = `${task.text} ${task.time ? "(" + task.time + ")" : ""}`;

    //create remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "X";
    removeBtn.style.marginLeft = "10px";

    //on remove click, run filter to keep every item except the removed
    removeBtn.onclick = () =>{
        li.remove();
        chrome.alarms.clear(task.id);

        chrome.storage.local.get(["tasks"], (result) => {
            const tasks = (result.tasks || []).filter(
                t => t.id !== task.id
            );
            chrome.storage.local.set({tasks});
        });
    };

    //create status button
    const statusBtn = document.createElement("button");
    statusBtn.style.marginLeft = "10px";
    statusBtn.textContent = "INC"
    statusBtn.style.color = "red";

    //status toggle update
    function statusUpdate() {
        if(task.done){
        statusBtn.textContent = "DONE";
        statusBtn.style.color = "green";
        }
        else{
            statusBtn.textContent = "INC";
            statusBtn.style.color = "red";
        }
    }

    statusUpdate();

    statusBtn.onclick = () => {
    task.done = !task.done;
    statusUpdate();

    if (task.done) {
        chrome.alarms.clear(task.id);
    } else if (task.time) {
        chrome.alarms.clear(task.id, () => {
            const now = new Date();
            const [h, m] = task.time.split(":");
            const alarmTime = new Date();
            alarmTime.setHours(h, m, 0, 0);

            if (alarmTime <= now) {
                alarmTime.setDate(alarmTime.getDate() + 1);
            }

            chrome.alarms.create(task.id, {
                when: alarmTime.getTime()
            });
        });
    }

    //keep changes stored
    chrome.storage.local.get(["tasks"], (result) => {
        const tasks = result.tasks || [];
        const updated = tasks.map(t =>
            t.id === task.id ? { ...t, done: task.done } : t
        );
        chrome.storage.local.set({ tasks: updated });
    });
};

li.appendChild(statusBtn);
li.appendChild(removeBtn);
taskList.appendChild(li);

}
