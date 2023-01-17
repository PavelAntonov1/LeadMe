// website components
const form = document.querySelector(".form");
const btnCloseForm = document.querySelector(".btn-close--form");
const mapContainer = document.querySelector(".map");
const btnDeleteActivity = document.querySelector(".btn-delete");

// form components
const inputActivity = document.querySelector(".form__input--activity");
const inputDate = document.querySelector(".form__input--date");
const inputTime = document.querySelector(".form__input--time");

const btnCreate = document.querySelector(".btn-submit");
const btnReset = document.querySelector(".btn-reset");
const btnToggle = document.querySelector(".btn-toggle");
const btnSortDate = document.querySelector("#sort-date");
const btnSortSport = document.querySelector("#sort-sport");
const btnSortMeeting = document.querySelector("#sort-meeting");
const btnSortWork = document.querySelector("#sort-work");
const btnSortStudy = document.querySelector("#sort-study");

const types = document.querySelectorAll(".form__radio-input");

const notificationsCenter = document.querySelector(".notifications-center");
const activitiesContainer = document.querySelector(".activities-container");
const notificationsContainer = document.querySelector(
  ".notifications-container"
);

const counter = document.querySelector(".counter");

class App {
  _userCoords;
  _map;
  _userActivities = [];
  _userMarkers = [];
  _userNotifications = [];
  _notificationsActive = 0;

  _userLocationIcon = L.icon({
    iconUrl: "../images/SVG/user-solid-circle.svg",
    iconSize: [50, 50],
    className: "icon-my-location",
  });

  _destinationIcon = L.icon({
    iconUrl: "../images/SVG/location.svg",
    iconSize: [50, 50],
    className: "icon-destination",
  });

  async init() {
    // 1. Get user coordinates
    this._userCoords = await this._getUserCoords();

    // 2. Set up the map
    this._map = this._createMap();

    // 3. Set user's location and local storage markers, activities and notifications
    this._setMarker(this._userLocationIcon, this._userCoords);
    this._initMarkers();
    this._initActivities();
    this._initNotifications();

    // 3. Set up event Listeners
    const self = this; // preserve this for event handlers
    let formActive = false;

    // handles clicks on map
    this._map.on("click", function (e) {
      self._showForm();
      formActive = true;

      const marker = self._setMarker(self._destinationIcon, [
        e.latlng.lat,
        e.latlng.lng,
      ]);

      self._userMarkers.push(marker);
    });

    // handles form closing
    btnCloseForm.addEventListener("click", function () {
      formActive = false;
      self._hideForm();
      self._deleteMarker(self._userMarkers.length - 1);
    });

    // handles activity creation through the form
    btnCreate.addEventListener("click", function (e) {
      formActive = false;
      self._renderActivity();
      self._setLocalStorage();
      self._hideForm();
    });

    // handles activity creation through the enter button press
    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && formActive === true) {
        self._renderActivity();
        self._setLocalStorage();
        self._hideForm();
        formActive = false;
      }
    });

    // handles activities deletion through close buttons
    activitiesContainer.addEventListener("click", function (e) {
      e.preventDefault();

      if (!e.target.closest(".btn-close")) return;

      const delActivity = e.target.closest(".activity");
      delActivity.style.opacity = "0";
      delActivity.style.transform = "translateX(-100%)";

      setTimeout(() => {
        delActivity.style.display = "none";
      }, 400);

      self._deleteActivity(+delActivity.dataset.id);
    });

    // handles activities activation through clicking on activities
    activitiesContainer.addEventListener("click", function (e) {
      e.preventDefault();

      const activity = e.target.closest(".activity");

      if (
        !activity ||
        e.target === document.querySelector(".btn-close") ||
        e.target === document.querySelector(".btn-close").firstElementChild
      )
        return;

      self._activateActivity(activity);
    });

    // handles notification center show/hide
    btnToggle.addEventListener("click", this._showNotifications.bind(this));

    // handles clicking on notifications
    notificationsContainer.addEventListener("click", function (e) {
      const clicked = e.target.closest(".pop-up");

      if (!clicked) return;

      const activity = [...activitiesContainer.children].find(
        (activity) => activity.dataset.id === clicked.dataset.id
      );

      if (!activity) {
        console.error("The activity is no longer available");
        return;
      }

      self._activateActivity(activity);
    });

    // handles notification deletion
    notificationsContainer.addEventListener("click", function (e) {
      if (!e.target.closest(".btn-close")) return;

      const delNotification = e.target.closest(".pop-up");

      delNotification.style.opacity = "0";
      delNotification.style.transform = "translateX(120%)";

      setTimeout(() => {
        delNotification.style.display = "none";
      }, 400);

      self._deleteNotification(+delNotification.dataset.id);
    });

    // SORTING
    btnSortDate.addEventListener(
      "click",
      this._sort.bind(this, "date", btnSortDate)
    );

    btnSortSport.addEventListener(
      "click",
      this._sort.bind(this, "sport", btnSortSport)
    );

    btnSortMeeting.addEventListener(
      "click",
      this._sort.bind(this, "meeting", btnSortMeeting)
    );

    btnSortWork.addEventListener(
      "click",
      this._sort.bind(this, "work", btnSortWork)
    );

    btnSortStudy.addEventListener(
      "click",
      this._sort.bind(this, "study", btnSortStudy)
    );

    // ROUTING
    this._routeArr([1, 2, 3]);
  }

  _getUserLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  async _getUserCoords() {
    const coordsObject = (await this._getUserLocation()).coords;
    return [coordsObject.latitude, coordsObject.longitude];
  }

  _createMap() {
    // create a map
    const map = L.map("map", {
      layers: MQ.mapLayer(),
      doubleClickZoom: false,
      center: [12, 12],
    }).setView(this._userCoords, 14);

    // set tiles and add to DOM
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }
    ).addTo(map);

    return map;
  }

  _setMarker(icon, coords) {
    return L.marker(coords, { icon: icon }).addTo(this._map);
  }

  _focusMarker() {}

  _deleteMarker(delID) {
    this._userMarkers[delID].remove();
    this._userMarkers.splice(delID, 1);
  }

  _showForm() {
    this._setDefaultInputs();
    form.classList.add("form--active");
  }

  _hideForm() {
    form.classList.remove("form--active");
  }

  _setDefaultInputs() {
    const [year, month, day] = [
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      new Date().getDate(),
    ];

    const [hours, minutes] = [new Date().getHours(), new Date().getMinutes()];

    inputActivity.value = "";

    inputDate.value = `${year}-${
      String(month).split("").length === 1 ? "0" + month : month
    }-${String(day).split("").length === 1 ? "0" + day : day}`;

    inputTime.value = `${
      String(hours).split("").length === 1 ? "0" + hours : hours
    }:${String(minutes).split("").length === 1 ? "0" + minutes : minutes}`;

    types.forEach((type, i) => (type.checked = i === 0 ? true : false));
  }

  _createActivity() {
    const activity = {};

    let type =
      [...types].find((type) => type.checked)?.dataset.type ?? undefined;

    // validation
    if (inputActivity.value === "") {
      console.error("Please enter the name of the activity");
      return;
    }

    if (!type) {
      console.error("Please select the type of the activity");
      return;
    }

    // set activity properties
    activity.name = inputActivity.value;
    activity.date = inputDate.value;
    activity.time = inputTime.value;
    activity.type = type;
    activity.id = new Date().getTime();

    // push to activities array
    this._userActivities.push(activity);

    this._setLocalStorage();

    return activity;
  }

  _renderActivity(activity = this._createActivity(), notifications = true) {
    // format icon
    let icon;
    if (activity.type === "work") icon = "💻";
    if (activity.type === "study") icon = "📚";
    if (activity.type === "sport") icon = "🏈";
    if (activity.type === "meeting") icon = "🤝🏻";
    if (activity.type === "other") icon = "...";

    // format date
    let date = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(activity.date + "T00:00:00.000"));

    const diffDates = new Date(activity.date + "T00:00:00.000") - Date.now();
    const diffDays = Math.ceil(diffDates / (1000 * 60 * 60 * 24));

    switch (diffDays) {
      case 0:
      case -0:
        date = "Today";
        break;
      case 1:
        date = "Tomorrow";
        break;
      case -1:
        date = "Yesterday";
        break;
    }

    // format time
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timezone: "GMT-7",
    }).format(new Date("2349-10-10 " + activity.time));

    // generate html string
    const htmlStr = `
    <div class="activity" data-id="${activity.id}">
      <button class="btn-close">
        <svg class="icon-trash-container">
          <use xlink:href="images/sprite.svg#icon-trash" class="icon-trash"></use>
        </svg>
      </button>
      <h4 class="activity__name"><span class="activity__text">${activity.name}</span><span class="activity__time"> at ${time}</span></h4>
      <div class="activity__type"><span class="icon">${icon}</span>${activity.type}</div>
      <div class="activity__date"><span class="icon">🗓️</span>${date}</div>
    </div>
    `;

    // insert on the page
    activitiesContainer.insertAdjacentHTML("afterbegin", htmlStr);

    if (!notifications) return;

    const notification = this._createNotification(
      `${activity.type} activity was created`,
      activity.id
    );

    this._renderNotification(notification);
  }

  _findActivity(id) {
    return this._userActivities.findIndex((activity) => activity.id === id);
  }

  _activateActivity(activity) {
    [...activitiesContainer.children].forEach((activity) =>
      activity.classList.remove("activity--active")
    );

    activity.classList.add("activity--active");
    const idx = this._findActivity(+activity.dataset.id);
    const marker = this._userMarkers[idx];

    this._userMarkers.forEach((marker) => {
      marker._icon.classList.remove("icon-destination--active");
    });

    marker._icon.classList.add("icon-destination--active");

    this._map.setView(marker._latlng, 14, { animate: true, duration: 1 });
  }

  _deleteActivity(id) {
    const delID = this._findActivity(id);

    const activity = this._userActivities[delID];
    const notification = this._createNotification(
      `${activity.type} activity was deleted`,
      Number(activity.id + "101010")
    );

    this._renderNotification(notification);

    this._userActivities.splice(delID, 1);
    this._deleteMarker(delID);

    this._setLocalStorage();
  }

  _setLocalStorage() {
    localStorage.setItem("activities", JSON.stringify(this._userActivities));

    const markers = this._userMarkers.map((marker) => {
      return {
        lat: marker._latlng.lat,
        lng: marker._latlng.lng,
      };
    });

    localStorage.setItem("markers", JSON.stringify(markers));

    localStorage.setItem(
      "notifications",
      JSON.stringify(this._userNotifications)
    );
  }

  _getLocalStorage() {
    const [activities, markers, notifications] = [
      JSON.parse(localStorage.getItem("activities")),
      JSON.parse(localStorage.getItem("markers")),
      JSON.parse(localStorage.getItem("notifications")),
    ];

    return {
      markersArr: markers,
      activitiesArr: activities,
      notificationsArr: notifications,
    };
  }

  _initMarkers() {
    const markers = this._getLocalStorage().markersArr;

    if (!markers) {
      console.log("No markers stored");
      return;
    }

    markers.forEach((marker) => {
      const newMarker = this._setMarker(this._destinationIcon, [
        marker.lat,
        marker.lng,
      ]);

      this._userMarkers.push(newMarker);
    });
  }

  _initActivities() {
    const activities = this._getLocalStorage().activitiesArr;

    if (!activities) {
      console.log("No activities stored");
      return;
    }

    activities.forEach((activity) => {
      this._userActivities.push(activity);
      this._renderActivity(activity, false);
    });
  }

  _initNotifications() {
    counter.classList.add("counter--hidden");
    const notifications = this._getLocalStorage().notificationsArr;

    if (!notifications) {
      console.log("No notifications stored");
      return;
    }

    notifications.forEach((notification) => {
      this._userNotifications.push(notification);
      this._renderNotification(notification);
    });
  }

  _sort(sortVal, btn) {
    let sortedActivities;
    let radioButton = document.querySelector(`#${btn.getAttribute("for")}`);

    if (radioButton.getAttribute("checked") === "true") {
      activitiesContainer.innerHTML = "";

      this._userActivities.forEach((activity) =>
        this._renderActivity(activity, false)
      );

      this._uncheckButton(btn);

      return;
    } else {
      [
        ...document.querySelector(".sort-container").querySelectorAll("label"),
      ].forEach((radioButton) => this._uncheckButton(radioButton));

      this._checkButton(btn);
    }

    activitiesContainer.innerHTML = "";

    if (sortVal === "date") {
      sortedActivities = [...this._userActivities].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    const sortByType = function (type) {
      const activities = [];
      const typeActivities = [];

      [...this._userActivities].forEach((activity) => {
        const arr = activity.type === type ? typeActivities : activities;
        arr.push(activity);
      });

      return [...activities, ...typeActivities];
    };

    if (sortVal === "sport") {
      sortedActivities = sortByType.call(this, "sport");
    }

    if (sortVal === "meeting") {
      sortedActivities = sortByType.call(this, "meeting");
    }

    if (sortVal === "work") {
      sortedActivities = sortByType.call(this, "work");
    }

    if (sortVal === "study") {
      sortedActivities = sortByType.call(this, "study");
    }

    sortedActivities.forEach((activity) =>
      this._renderActivity(activity, false)
    );
  }

  _checkButton(btn) {
    document
      .querySelector(`#${btn.getAttribute("for")}`)
      .setAttribute("checked", "true");

    btn.style = "";
    btn.style.backgroundImage = "none";
    btn.style.backgroundColor = "var(--color-primary)";
  }

  _uncheckButton(btn) {
    document
      .querySelector(`#${btn.getAttribute("for")}`)
      .setAttribute("checked", "false");

    btn.style = "";
    btn.style.backgroundImage =
      "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 100%);";
    btn.style.backgroundColor = "none";
  }

  _showNotifications() {
    notificationsCenter.classList.toggle("notifications-center--hidden");
  }

  _createNotification(text, activityId) {
    const notification = {
      notificationText: text,
      active: true,
      id: activityId,
    };

    this._userNotifications.push(notification);

    return notification;
  }

  _renderNotification(notificationObj) {
    const template = document.createElement("template"); // to create an element from html string, template has no restrictions on what is inside it unlike div

    const htmlStr = `
    <div class="pop-up ${
      notificationObj.active ? "pop-up--new" : ""
    }" data-id="${notificationObj.id}">
      <svg class="pop-up__icon-container">
        <use
          xlink:href="images/sprite.svg#icon-notification"
          class="pop-up__icon"
        ></use>
      </svg>

      <p class="pop-up__text">
        ${notificationObj.notificationText}
      </p>

      <button class="btn-close btn-close--notification">&times;</button>
    </div>
    `;

    template.innerHTML = htmlStr;
    const notification = template.content.firstElementChild;

    notificationsContainer.prepend(notification);
    this._observeNotification(notification);

    if (notificationObj.active) ++this._notificationsActive;

    this._setLocalStorage();

    if (this._notificationsActive > 0) {
      counter.classList.remove("counter--hidden");
      counter.textContent = this._notificationsActive;
    }
  }

  _observeNotification(notification) {
    let options = {
      root: null,
      threshold: 1,
    };

    const callback = function (entries, observer) {
      const [entry] = entries;

      if (!entry.isIntersecting) return;

      const notificationObj =
        this._userNotifications[
          this._findNotification(+entry.target.dataset.id)
        ];

      if (!notificationObj.active) return;

      notificationObj.active = false;

      entry.target.classList.remove("pop-up--new");
      observer.unobserve(entry.target);

      --this._notificationsActive;

      this._setLocalStorage();

      if (this._notificationsActive <= 0) {
        counter.classList.add("counter--hidden");
        return;
      }

      counter.textContent = this._notificationsActive;
    };

    const observer = new IntersectionObserver(callback.bind(this), options);
    observer.observe(notification);
  }

  _findNotification(id) {
    return this._userNotifications.findIndex(
      (notification) => notification.id === id
    );
  }

  _deleteNotification(id) {
    const idx = this._findNotification(id);

    this._userNotifications.splice(idx, 1);
    this._setLocalStorage();
  }
}

const app = new App();
app.init();
