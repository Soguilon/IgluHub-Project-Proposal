(function(){
  "use strict";

  /* ---------------- SLIDE NAVIGATION ---------------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var total = slides.length;
  var current = 0;

  var progressFill = document.getElementById("progressFill");
  var currentNumEl = document.getElementById("currentSlideNum");
  var totalNumEl = document.getElementById("totalSlideNum");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var overviewBtn = document.getElementById("overviewBtn");
  var overviewPanel = document.getElementById("overviewPanel");
  var overviewGrid = document.getElementById("overviewGrid");
  var closeOverview = document.getElementById("closeOverview");
  var fullscreenBtn = document.getElementById("fullscreenBtn");

  totalNumEl.textContent = total;

  function buildOverview(){
    overviewGrid.innerHTML = "";
    slides.forEach(function(s, i){
      var card = document.createElement("div");
      card.className = "overview-card";
      card.setAttribute("tabindex", "0");
      card.innerHTML = '<span class="ov-num">' + String(i+1).padStart(2,"0") + '</span><span class="ov-title">' + (s.dataset.title || "Slide") + '</span>';
      card.addEventListener("click", function(){ goTo(i); closeOverviewPanel(); });
      card.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); goTo(i); closeOverviewPanel(); }
      });
      overviewGrid.appendChild(card);
    });
  }

  function refreshOverviewActive(){
    var cards = overviewGrid.querySelectorAll(".overview-card");
    cards.forEach(function(c, i){ c.classList.toggle("current", i === current); });
  }

  function render(){
    slides.forEach(function(s, i){
      s.classList.remove("active", "prev-slide");
      if(i === current){
        s.classList.add("active");
      } else if(i < current){
        s.classList.add("prev-slide");
      }
    });
    currentNumEl.textContent = current + 1;
    progressFill.style.width = ((current + 1) / total * 100) + "%";
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    prevBtn.style.opacity = prevBtn.disabled ? 0.35 : 1;
    nextBtn.style.opacity = nextBtn.disabled ? 0.35 : 1;
    refreshOverviewActive();
  }

  function goTo(i){
    if(i < 0 || i >= total) return;
    current = i;
    render();
  }
  function next(){ if(current < total - 1) goTo(current + 1); }
  function prev(){ if(current > 0) goTo(current - 1); }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  /* ---------------- OVERVIEW PANEL ---------------- */
  function openOverviewPanel(){
    buildOverview();
    refreshOverviewActive();
    overviewPanel.classList.add("open");
    overviewPanel.setAttribute("aria-hidden", "false");
  }
  function closeOverviewPanel(){
    overviewPanel.classList.remove("open");
    overviewPanel.setAttribute("aria-hidden", "true");
  }
  overviewBtn.addEventListener("click", openOverviewPanel);
  closeOverview.addEventListener("click", closeOverviewPanel);
  overviewPanel.addEventListener("click", function(e){
    if(e.target === overviewPanel) closeOverviewPanel();
  });

  /* ---------------- FULLSCREEN ---------------- */
  fullscreenBtn.addEventListener("click", function(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  });

  /* ---------------- IMAGE VIEWER ---------------- */
  var viewer = document.getElementById("viewer");
  var viewerImg = document.getElementById("viewerImg");
  var viewerStage = document.getElementById("viewerStage");
  var viewerCaption = document.getElementById("viewerCaption");
  var viewerClose = document.getElementById("viewerClose");
  var vcZoomIn = document.getElementById("vcZoomIn");
  var vcZoomOut = document.getElementById("vcZoomOut");
  var vcReset = document.getElementById("vcReset");
  var vcFit = document.getElementById("vcFit");
  var vcPrev = document.getElementById("vcPrev");
  var vcNext = document.getElementById("vcNext");

  var scale = 1, posX = 0, posY = 0;
  var isDragging = false, dragStartX = 0, dragStartY = 0, startPosX = 0, startPosY = 0;
  var pinchStartDist = 0, pinchStartScale = 1;

  var galleries = {};
  var activeGalleryName = null;
  var activeIndex = 0;

  document.querySelectorAll("[data-zoomable]").forEach(function(frame){
    var galleryName = frame.dataset.gallery || "default";
    if(!galleries[galleryName]) galleries[galleryName] = [];
    var idx = galleries[galleryName].length;
    galleries[galleryName].push({
      src: frame.querySelector("img").getAttribute("src"),
      caption: frame.dataset.caption || "",
      alt: frame.querySelector("img").getAttribute("alt") || ""
    });
    frame.addEventListener("click", function(){
      openViewer(galleryName, idx);
    });
    frame.setAttribute("tabindex", "0");
    frame.setAttribute("role", "button");
    frame.setAttribute("aria-label", "Open image viewer: " + (frame.dataset.caption || "image"));
    frame.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openViewer(galleryName, idx); }
    });
  });

  function resetTransform(){
    scale = 1; posX = 0; posY = 0;
    applyTransform();
  }
  function applyTransform(){
    viewerImg.style.transform = "translate(" + posX + "px," + posY + "px) scale(" + scale + ")";
  }
  function clampScale(s){ return Math.min(Math.max(s, 0.5), 6); }

  function openViewer(galleryName, idx){
    activeGalleryName = galleryName;
    activeIndex = idx;
    renderViewerImage();
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function renderViewerImage(){
    var item = galleries[activeGalleryName][activeIndex];
    viewerImg.src = item.src;
    viewerImg.alt = item.alt;
    viewerCaption.textContent = item.caption;
    resetTransform();
    var list = galleries[activeGalleryName];
    vcPrev.style.visibility = list.length > 1 ? "visible" : "hidden";
    vcNext.style.visibility = list.length > 1 ? "visible" : "hidden";
  }
  function closeViewer(){
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function viewerNext(){
    var list = galleries[activeGalleryName];
    activeIndex = (activeIndex + 1) % list.length;
    renderViewerImage();
  }
  function viewerPrev(){
    var list = galleries[activeGalleryName];
    activeIndex = (activeIndex - 1 + list.length) % list.length;
    renderViewerImage();
  }

  viewerClose.addEventListener("click", closeViewer);
  viewer.addEventListener("click", function(e){ if(e.target === viewer) closeViewer(); });
  vcNext.addEventListener("click", viewerNext);
  vcPrev.addEventListener("click", viewerPrev);
  vcZoomIn.addEventListener("click", function(){ scale = clampScale(scale + 0.4); applyTransform(); });
  vcZoomOut.addEventListener("click", function(){ scale = clampScale(scale - 0.4); applyTransform(); });
  vcReset.addEventListener("click", resetTransform);
  vcFit.addEventListener("click", resetTransform);

  // Mouse wheel zoom
  viewerStage.addEventListener("wheel", function(e){
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.15 : 0.15;
    scale = clampScale(scale + delta);
    applyTransform();
  }, { passive:false });

  // Drag to pan (mouse)
  viewerStage.addEventListener("mousedown", function(e){
    isDragging = true;
    viewerStage.classList.add("dragging");
    dragStartX = e.clientX; dragStartY = e.clientY;
    startPosX = posX; startPosY = posY;
  });
  window.addEventListener("mousemove", function(e){
    if(!isDragging) return;
    posX = startPosX + (e.clientX - dragStartX);
    posY = startPosY + (e.clientY - dragStartY);
    applyTransform();
  });
  window.addEventListener("mouseup", function(){
    isDragging = false;
    viewerStage.classList.remove("dragging");
  });

  // Touch: pan + pinch zoom
  function touchDist(touches){
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
  }
  viewerStage.addEventListener("touchstart", function(e){
    if(e.touches.length === 1){
      isDragging = true;
      dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
      startPosX = posX; startPosY = posY;
    } else if(e.touches.length === 2){
      isDragging = false;
      pinchStartDist = touchDist(e.touches);
      pinchStartScale = scale;
    }
  }, { passive:true });
  viewerStage.addEventListener("touchmove", function(e){
    if(e.touches.length === 1 && isDragging){
      posX = startPosX + (e.touches[0].clientX - dragStartX);
      posY = startPosY + (e.touches[0].clientY - dragStartY);
      applyTransform();
    } else if(e.touches.length === 2){
      var d = touchDist(e.touches);
      scale = clampScale(pinchStartScale * (d / pinchStartDist));
      applyTransform();
    }
  }, { passive:true });
  viewerStage.addEventListener("touchend", function(){ isDragging = false; });

  /* ---------------- KEYBOARD SHORTCUTS ---------------- */
  document.addEventListener("keydown", function(e){
    var viewerOpen = viewer.classList.contains("open");
    var overviewOpen = overviewPanel.classList.contains("open");

    if(e.key === "Escape"){
      if(viewerOpen){ closeViewer(); return; }
      if(overviewOpen){ closeOverviewPanel(); return; }
      if(document.fullscreenElement){ document.exitFullscreen(); return; }
      return;
    }

    // Block slide navigation while viewer or overview is open (except Escape handled above)
    if(viewerOpen){
      if(e.key === "ArrowRight"){ viewerNext(); }
      else if(e.key === "ArrowLeft"){ viewerPrev(); }
      else if(e.key === "+" || e.key === "="){ scale = clampScale(scale + 0.3); applyTransform(); }
      else if(e.key === "-"){ scale = clampScale(scale - 0.3); applyTransform(); }
      else if(e.key === "0"){ resetTransform(); }
      return;
    }
    if(overviewOpen) return;

    switch(e.key){
      case "ArrowRight":
      case " ":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
        prev();
        break;
      case "Home":
        goTo(0);
        break;
      case "End":
        goTo(total - 1);
        break;
    }
  });

  /* ---------------- SWIPE NAVIGATION (slides) ---------------- */
  var swipeStartX = null, swipeStartY = null;
  document.getElementById("slides").addEventListener("touchstart", function(e){
    if(e.touches.length !== 1) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }, { passive:true });
  document.getElementById("slides").addEventListener("touchend", function(e){
    if(swipeStartX === null) return;
    var dx = e.changedTouches[0].clientX - swipeStartX;
    var dy = e.changedTouches[0].clientY - swipeStartY;
    if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)){
      if(dx < 0) next(); else prev();
    }
    swipeStartX = null; swipeStartY = null;
  }, { passive:true });

  /* ---------------- INIT ---------------- */
  render();
})();
