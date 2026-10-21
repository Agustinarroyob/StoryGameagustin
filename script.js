let minutesLeft = 4;
const inventory = new Set();
const searchedLocations = new Set();

const sceneTitle = document.getElementById("scene-title");
const sceneText = document.getElementById("scene-text");
const characterName = document.getElementById("character-name");
const choicesContainer = document.getElementById("choices-container");
const timeDisplay = document.getElementById("time-display");
const inventoryDisplay = document.getElementById("inventory-display");
const messageDisplay = document.getElementById("message-display");

const gear = ["Soccer boot #1", "Soccer boot #2", "Shin guards"];
const locations = [
  { id: "sisters-room", label: "Sister's room", timeCost: 1 },
  { id: "bathroom", label: "Bathroom", timeCost: 1 },
  { id: "living-room", label: "Living room", item: "Soccer boot #1" },
  { id: "garage", label: "Garage", timeCost: 1 },
  { id: "car", label: "Inside the car", item: "Soccer boot #2" },
  { id: "kitchen", label: "Kitchen" }
];
let cabinetsSearched = false;

const scenes = {
  introduction: {
    title: "The Championship Game",
    character: "Player",
    text: "Where are my soccer boots? The championship game is today, and my team is counting on me. I need my boots and shin guards before we leave. Parent: “We are leaving in 4 minutes!”",
    choices: [{ text: "Start looking", nextScene: "search" }]
  },
  search: {
    title: "At Home",
    character: "Player",
    text: "I have to find both soccer boots and my shin guards. Where should I look?",
    getChoices() {
      const choices = locations
        .filter((location) => !searchedLocations.has(location.id))
        .map((location) => ({
          text: location.item
            ? `Search ${location.label} (find ${location.item}; no time lost)`
            : `Search ${location.label}${location.timeCost ? ` (-${location.timeCost} minute)` : ""}`,
          action: () => searchLocation(location)
        }));

      if (hasAllGear()) {
        choices.unshift({
          text: "Tell my parent I'm ready",
          nextScene: "ready"
        });
      }

      return choices;
    }
  },
  "sisters-room": {
    title: "Sister's Room",
    character: "Player",
    text: "Maybe my boots are in here. I look around, but they aren't here. I wasted a minute!",
    choices: [{ text: "Keep looking", nextScene: "search" }]
  },
  bathroom: {
    title: "Bathroom",
    character: "Player",
    text: "Maybe I left my shin guards in here. I search the bathroom, but I don't find them. I wasted a minute!",
    choices: [{ text: "Keep looking", nextScene: "search" }]
  },
  "living-room": {
    title: "Living Room",
    character: "Player",
    text: "Maybe my boots are here. I found one soccer boot! But where is the other one?",
    choices: [{ text: "Keep looking", nextScene: "search" }]
  },
  garage: {
    title: "Garage",
    character: "Player",
    text: "Maybe the other boot is in here. I look around, but I find nothing. Parent: “We are leaving soon!” Player: “I need to hurry!”",
    choices: [{ text: "Keep looking", nextScene: "search" }]
  },
  car: {
    title: "Inside the Car",
    character: "Player",
    text: "Wait, what's that? I found my other soccer boot! Now I just need my shin guards.",
    choices: [{ text: "Keep looking", nextScene: "search" }]
  },
  kitchen: {
    title: "Kitchen",
    character: "Player",
    text: "Where are my shin guards? I can search the cabinets or check the fridge.",
    getChoices() {
      const choices = [];
      if (!inventory.has("Shin guards")) {
        if (!cabinetsSearched) {
          choices.push({
            text: "Search the cabinets (-1 minute; no shin guards)",
            action() {
              cabinetsSearched = true;
              if (!spendTime(1)) {
                return;
              }
              updateScene("kitchen");
              messageDisplay.textContent = "You check the cabinets, but the shin guards aren't there. A minute has passed!";
            }
          });
        }
        choices.push({
          text: "Search the fridge (find shin guards; no time lost)",
          action() {
            inventory.add("Shin guards");
            updateDisplays();
            updateScene(hasAllGear() ? "ready" : "kitchen");
          }
        });
      }
      if (hasAllGear()) {
        choices.push({ text: "Tell my parent I'm ready", nextScene: "ready" });
      }
      choices.push({ text: "Go back", nextScene: "search" });
      return choices;
    }
  },
  ready: {
    title: "Ready to Leave",
    character: "Player",
    text: "Parent: “Are you ready?” Player: “Yes, I found everything!”",
    choices: [{ text: "Get in the car", action: finishGame }]
  },
  missed: {
    title: "Game Missed",
    character: "Player",
    text: "Parent: “It's time to go!” Player: “A little more, please! I can't find my cleats.” Time ran out, and I can't play in the championship game without my cleats and shin guards. I missed the game.",
    choices: [{ text: "Play again", action: restartGame }]
  },
  onTime: {
    title: "You Made It!",
    character: "Player",
    text: "Parent: “Are you ready?” Player: “Yes, I found everything!” You get into the car and make it to the championship game on time. Your team is counting on you!",
    choices: [{ text: "Play again", action: restartGame }]
  },
  justInTime: {
    title: "Just in Time!",
    character: "Player",
    text: "Player: “I found everything!” Parent: “Then hurry up!” You rush to the car and climb inside. Player: “That was close!” Your family leaves for the championship game just in time.",
    choices: [{ text: "Play again", action: restartGame }]
  }
};

function hasAllGear() {
  return gear.every((item) => inventory.has(item));
}

function updateDisplays() {
  timeDisplay.textContent = `${minutesLeft} ${minutesLeft === 1 ? "minute" : "minutes"}`;
  inventoryDisplay.textContent = inventory.size > 0
    ? [...inventory].join(", ")
    : "Nothing found yet";
}

function updateScene(sceneName) {
  const scene = scenes[sceneName];
  sceneTitle.textContent = scene.title;
  sceneText.textContent = scene.text;
  characterName.textContent = scene.character;
  choicesContainer.replaceChildren();
  messageDisplay.textContent = "";

  const choices = scene.getChoices ? scene.getChoices() : scene.choices;
  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.text;
    button.addEventListener("click", () => {
      if (choice.action) {
        choice.action();
      }
      if (choice.nextScene) {
        updateScene(choice.nextScene);
      }
    });
    choicesContainer.appendChild(button);
  });
}

function spendTime(minutes) {
  minutesLeft = Math.max(0, minutesLeft - minutes);
  updateDisplays();
  if (minutesLeft === 0) {
    updateScene("missed");
    return false;
  }
  return true;
}

function searchLocation(location) {
  searchedLocations.add(location.id);

  if (location.timeCost && !spendTime(location.timeCost)) {
    return;
  }
  if (location.item) {
    inventory.add(location.item);
    updateDisplays();
  }

  updateScene(location.id);
}

function finishGame() {
  updateScene(minutesLeft === 1 ? "justInTime" : "onTime");
}

function restartGame() {
  minutesLeft = 4;
  inventory.clear();
  searchedLocations.clear();
  cabinetsSearched = false;
  updateDisplays();
  updateScene("introduction");
}

updateDisplays();
updateScene("introduction");
