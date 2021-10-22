(function () {
  window.cookieconsent.initialise({
    palette: {
      popup: {
        background: "#efefef",
        text: "#404040",
      },
      button: {
        background: "#8ec760",
        text: "#ffffff",
      },
    },
    theme: "classic",
    position: "bottom-left",
    type: "opt-in",
    content: {
      deny: "deny",
      href: "/public/help/privacy-policy.html ",
    },
    onStatusChange: (status, chosenBefore) => {
      if (this.hasConsented()) {
        console.log("Allowed");
      } else {
        console.log("denied");
      }
    },
  });
})();
