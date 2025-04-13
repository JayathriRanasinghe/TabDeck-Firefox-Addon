// === Add this near the top or bottom of sidebar.js ===
const COLOR_CHOICES = [
    "#FF6347",  // red
    "#FFD700",  // yellow
    "#4682B4",  // blue
    "#32CD32",  // green
    "#FFA500",  // orange
    "#9370DB",  // purple
    "#FF69B4"   // pink
  ];
  
  let selectedColor = COLOR_CHOICES[0]; // default selected color
  
  function createColorOptions() {
    const container = document.getElementById("color-options");
    container.innerHTML = "";
  
    COLOR_CHOICES.forEach((color, idx) => {
      const circle = document.createElement("div");
      circle.className = "color-circle";
      circle.style.backgroundColor = color;
  
      if (idx === 0) circle.classList.add("selected");
  
      circle.addEventListener("click", () => {
        document.querySelectorAll(".color-circle").forEach(el => el.classList.remove("selected"));
        circle.classList.add("selected");
        selectedColor = color;
      });
  
      container.appendChild(circle);
    });
  }
  
  // Call on load
  document.addEventListener("DOMContentLoaded", createColorOptions);
  