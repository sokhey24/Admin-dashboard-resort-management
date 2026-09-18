function navMarkup(active) {
  const session = GuestAPI.auth.session();
  const unread = session ? GuestAPI.notifications.unreadCount() : 0;
  const servicePages = ["services.html", "activities.html", "dining.html", "gallery.html"];
  const serviceOpen = servicePages.includes(active);
  const initial = session ? escapeHtml((session.name || "G").charAt(0).toUpperCase()) : "G";

  const guestAuth = session
    ? `<div class="nav-profile" id="navProfile">
         <button class="profile-btn" id="profileToggle" type="button" aria-label="Profile" aria-expanded="false">
           <span class="profile-avatar">${initial}</span>
           <span class="profile-name">${escapeHtml(session.name)}</span>
           ${unread ? `<span class="count-dot">${unread}</span>` : ""}
         </button>
         <div class="profile-menu" id="profileMenu">
           <a href="account.html">Profile</a>
           <a href="account-bookings.html">My bookings</a>
           <a href="account-notifications.html">Notifications${unread ? ` (${unread})` : ""}</a>
           <a href="account-settings.html">Settings</a>
           <button type="button" id="logoutBtn">Logout</button>
         </div>
       </div>`
    : `<a class="btn btn-ghost" href="login.html">Login</a>
       <a class="btn btn-primary" href="register.html">Register</a>`;

  return `
    <header class="site-header">
      <nav class="site-nav" id="siteNav">
        <a class="logo" href="home.html">
          <img src="images/logo.png" alt="Solara Resort">
        </a>
        <button class="menu-toggle" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navPanel">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="nav-panel" id="navPanel">
          <ul class="nav-links">
            <li><a class="${active === "home.html" ? "active" : ""}" href="home.html">Home</a></li>
            <li><a class="${active === "room.html" ? "active" : ""}" href="room.html">Rooms</a></li>
            <li class="has-dropdown">
              <a class="${serviceOpen ? "active" : ""}" href="services.html" id="serviceMenuBtn" aria-haspopup="true" aria-expanded="false">
                Service <i class="fa-solid fa-chevron-down chevron" aria-hidden="true"></i>
              </a>
              <ul class="dropdown-menu">
                <li><a class="${active === "activities.html" ? "active" : ""}" href="activities.html">Activity</a></li>
                <li><a class="${active === "dining.html" ? "active" : ""}" href="dining.html">Dining</a></li>
                <li><a class="${active === "gallery.html" ? "active" : ""}" href="gallery.html">Gallery</a></li>
              </ul>
            </li>
            <li><a class="${active === "aboutus.html" ? "active" : ""}" href="aboutus.html">About</a></li>
            <li><a class="${active === "contact.html" ? "active" : ""}" href="contact.html">Contact</a></li>
          </ul>
          <div class="nav-actions">
            ${guestAuth}
          </div>
        </div>
      </nav>
    </header>`;
}

function footerMarkup() {
  const r = GuestAPI.catalog.resort();
  const session = GuestAPI.auth.session();
  const bookingLink = session ? `<a href="booking.html">Booking</a>` : "";
  return `
    <footer class="site-footer">
      <div class="footer-top">
        <h2>Get in touch</h2>
        <form class="footer-form" id="contactForm" data-source="footer">
          <div class="form-row">
            <input class="field" name="firstName" placeholder="First name" required>
            <input class="field" name="lastName" placeholder="Last name" required>
          </div>
          <div class="form-row">
            <input class="field" type="email" name="email" placeholder="Email address" required>
            <input class="field" name="phone" placeholder="Phone number">
          </div>
          <textarea name="message" placeholder="Message" required></textarea>
          <button class="btn btn-primary" type="submit" style="width:100%">Submit now</button>
          <p class="hint" id="footerFormMsg" hidden></p>
        </form>
      </div>
      <div class="footer-grid">
        <div>
          <a class="logo footer-logo" href="home.html">
            <img src="images/logo.png" alt="Solara Resort">
          </a>
          <p>${escapeHtml(r.tagline)}</p>
        </div>
        <div>
          <h3>Contact</h3>
          <p>Phone: ${escapeHtml(r.phone)}</p>
          <p>Email: ${escapeHtml(r.email)}</p>
          <p>Address: ${escapeHtml(r.address)}</p>
          <p>Check in: ${escapeHtml(r.checkIn)} · Check out: ${escapeHtml(r.checkOut)}</p>
          <p>© ${new Date().getFullYear()} Solara Resort</p>
        </div>
        <div>
          <h3>Quick links</h3>
          <div class="chip-links">
            <a href="home.html">Home</a>
            <a href="room.html">Rooms</a>
            <a href="services.html">Services</a>
            <a href="dining.html">Dining</a>
            <a href="contact.html">Contact</a>
            ${bookingLink}
          </div>
        </div>
        <div>
          <h3>Stay in touch</h3>
          <div class="social">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="fab fa-twitter"></i></a>
          </div>
          <button class="btn btn-dark" type="button" id="shareBtn">Share this page</button>
          <h4>We accept</h4>
          <div class="pay">
            <i class="fab fa-cc-visa"></i>
            <i class="fab fa-cc-mastercard"></i>
            <i class="fab fa-cc-amex"></i>
            <i class="fab fa-cc-paypal"></i>
          </div>
        </div>
      </div>
    </footer>`;
}

function mountShell() {
  const page = document.body.dataset.page || "";
  const map = {
    home: "home.html",
    rooms: "room.html",
    activities: "activities.html",
    services: "services.html",
    dining: "dining.html",
    gallery: "gallery.html",
    about: "aboutus.html",
    contact: "contact.html",
    booking: "booking.html",
    confirm: "booking-confirm.html",
    login: "login.html",
    register: "register.html",
    account: "account.html",
    "account-bookings": "account-bookings.html",
    "account-notifications": "account-notifications.html",
    "account-settings": "account-settings.html",
    detail: "room.html"
  };

  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  document.body.classList.toggle("guest-signed-in", Boolean(GuestAPI.auth.session()));
  if (header) header.innerHTML = navMarkup(map[page] || "");
  if (footer) footer.innerHTML = footerMarkup();

  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("menuToggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  const serviceBtn = document.getElementById("serviceMenuBtn");
  const serviceItem = serviceBtn?.closest(".has-dropdown");
  const closeServiceMenu = () => {
    serviceItem?.classList.remove("open");
    serviceBtn?.setAttribute("aria-expanded", "false");
  };
  serviceBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const open = serviceItem.classList.toggle("open");
    serviceBtn.setAttribute("aria-expanded", String(open));
  });
  serviceItem?.querySelectorAll(".dropdown-menu a").forEach((link) => {
    link.addEventListener("click", () => closeServiceMenu());
  });
  document.addEventListener("click", (e) => {
    if (serviceItem && !serviceItem.contains(e.target)) closeServiceMenu();
  });

  const profile = document.getElementById("navProfile");
  const profileToggle = document.getElementById("profileToggle");
  profileToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = profile.classList.toggle("open");
    profileToggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (profile && !profile.contains(e.target)) {
      profile.classList.remove("open");
      profileToggle?.setAttribute("aria-expanded", "false");
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      GuestAPI.auth.logout();
      toast("Signed out");
      location.href = "home.html";
    });
  }

  document.querySelectorAll("form[data-source]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      GuestAPI.contact.send({ ...data, source: form.dataset.source || "form" });
      form.reset();
      const msg = form.querySelector(".hint") || document.getElementById("footerFormMsg");
      if (msg) {
        msg.hidden = false;
        msg.textContent = "Message saved on this device. No hotel inbox was used.";
      }
      toast("Message saved on this device.");
    });
  });

  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const payload = { title: "Solara Resort", text: "Stay at Solara Resort", url: location.href };
      if (navigator.share) {
        try {
          await navigator.share(payload);
        } catch {
          /* cancelled */
        }
      } else {
        await navigator.clipboard.writeText(location.href);
        toast("Page link copied");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", mountShell);
