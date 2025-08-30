plugins = {
  delay: function(ms) {
    return new Promise(res => setTimeout(res, ms));
  },
  type: async function(element, text) {
    element.textContent = "";
    for (let i = 0; i < text.length; i++) {
      element.textContent += text.charAt(i);
      await new Promise(requestAnimationFrame);
    }
  }
}