var serviceAddress = "main.php";
var topImageContainer = "#topImage";
var bottomImageContainer = "#bottomImage";

var allPictures = [];
var dayPictures = [];
var days = [];
var currentDay = 0;
var currentPicture = 0;
var playerSpeed = 1;
var pictureDelay = 1500;
var origPictureDelay = pictureDelay;

var lastDayChangeAction = "";

var started = false;
var globalSlider = 0;
var timer = null;
var firstImage;
var picturesWidth = 1280;
var picturesHeight = 720;

var imageBuffer = [];
var imageBufferMaxSize = 25;
var currentCacheNo = 0;
var imageBufferSize = imageBufferMaxSize;

var isFullscreen = false;
var tilaDatePicker;

var opc = 0;
var monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var movieURI ="";
var embeddedDiv;
var isEmbedded;

var autoResizeImage=true;

const params = new URLSearchParams(window.location.search);
var ppath = (params.has('ppath') && params.get('ppath') ) || "/California/laoverview.stream";
function fillImageCache() {
    for(var i=0;i<imageBufferSize;i++){        
        cacheImage(currentCacheNo+i);     
    }
    currentCacheNo+=i;        
}

function cacheImage(imageNo){
    if (imageBufferSize === 0 || imageNo >= dayPictures.length)
        return;
    imageBufferSize -=1;    
    var img = new Image();
    img.src = dayPictures[imageNo].webPath;
    console.log("Caching Image: "+imageNo);
}


function displayFirstPicture() {
    $.getJSON(serviceAddress, {"action": "getFirstPicture","ppath": ppath})
            .done(function (json) {
                console.log("JSON FirstPicture: " + json.webPath);
                firstImage = new Image();
                firstImage.onload = function () {
                    picturesHeight = firstImage.naturalHeight;
                    picturesWidth = firstImage.naturalWidth;
                    fitPicture();                    
                    displayImage();
                    currentPicture++;                    
                    //$(topImageContainer).attr("src", json.webPath);
                }
                firstImage.src = json.name;

            })
            .fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Request Failed: " + err);
            });
}

function getAvailableDays() {
    $.getJSON(serviceAddress, {action: "getAvailableDays"})
            .done(function (json) {
                console.log("JSON getAvailableDays: ");
                $.each(json, function (key, val) {
                    days.push(key);
                    //console.log("day: " + key + " pictures: " + val);
                });
                console.log("Days count: " + days.length);
                currentDay = days.length - 1;
                getPicturesForCurrentDay();
            })
            .fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Request Failed: " + err);
            });
}

function getPicturesForCurrentDay() {
    var isStarted = started;
    if (isStarted)
        stop();
    dayPictures = [];
    
    var day = days[currentDay];
    $.getJSON(serviceAddress, {"action": "getPicturesForDay", "day": day, "ppath":ppath})
            .done(function (json) {
                console.log("JSON getPicturesForDay: " + day);
                $.each(json, function (key, val) {
                    dayPictures.push(val);
                    //console.log("day picture: " + val.name);
                });
                console.log("Day Picture count: " + dayPictures.length);
                updateSlider();
                if (lastDayChangeAction == "next") {
                    currentPicture = 0;
                    lastDayChangeAction = "";
                    displayImage();
                }
                if (lastDayChangeAction === "previous") {
                    currentPicture = dayPictures.length - 1;
                    lastDayChangeAction = "";
                    displayImage();
                }

                if (isStarted)
                    start();
            })
            .fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Request Failed: " + err);
            });
}

function nextPicture() {
    stopIfStarted();
    currentPicture++;
    displayImage();
}

function previousPicture() {
    stopIfStarted();
    currentPicture--;
    displayImage();
}

function stopIfStarted() {
    if (started)
        stop();
}

function tick() {
    start();        // restart the timer
}

function start() {  // use a one-off timer
    playSlider();
    timer = setTimeout(tick, pictureDelay);
    started = true;
}


function stop() {
    clearTimeout(timer);
    started = false;
}


function playSlider() {
    displayImage();
    currentPicture++;
}

function displayImage() {
    if (currentPicture > dayPictures.length - 1) {
        changeDay("next");
        return;
    }

    if (currentPicture < 0) {
        currentPicture = dayPictures.length - 1;
        changeDay("previous");
        return;
    }

    if (dayPictures[currentPicture] === undefined)
        return;
    imageBufferSize+=1;
    fillImageCache();    
    $('#timeSlider').val(currentPicture + 1).change();

    if (opc > 0) {
        if (opc % 2 === 0) {
            $(bottomImageContainer).attr('src', dayPictures[currentPicture].webPath);
            $(bottomImageContainer).addClass('fadein');
        } else {
            $(topImageContainer).attr('src', dayPictures[currentPicture].webPath);
            $(bottomImageContainer).removeClass('fadein');
        }
    }

    console.log("Play Picture " + currentPicture + " " + dayPictures[currentPicture].webPath);

    opc++;
}

function changeDay(direction) {
    lastDayChangeAction = direction;
    if (direction === "next")
        currentDay++;
    if (direction === "previous")
        currentDay--;

    if (currentDay > days.length - 1)
        currentDay = 0;
    if (currentDay < 0)
        currentDay = days.length - 1;

    currentPicture = 0;
    getPicturesForCurrentDay();
  
}

function tilacamPlay() {
    start();
}

function tilacamStop() {
    stop();
}

function togglePlay() {
    if (started) {
        $("#playPause").text("play_arrow");
        stop();
    } else {
        $("#playPause").text("pause");
        start();
    }
}

function showDatePicker() {
    var currentDate = new Date(days[currentDay]);
    console.log('Set Datepicker to current Day: ' + currentDate.toString());
    if (tilaDatePicker === undefined) {
        tilaDatePicker = $("#tilaHiddenDate").datepicker({
            language: 'en',
            startDate: currentDate,
            onRenderCell: function (date, cellType) {
                //console.log('Render '+date.toString()+" cell "+cellType.toString());
                if (tilaIsDateAvailable(date,cellType)) {
                    return {append: '<span class="dp-note"></span>'};
                }
            },
            onSelect: function onSelect(fd, date) {
                console.log('Select Cell ' + fd);
                tilaSetDate(date);
                tilaDatePicker.data('datepicker').hide();
            }
        });
    }
    hideMainMenu();
    tilaDatePicker.data('datepicker').selectDate(currentDate);
    tilaDatePicker.data('datepicker').show();
}

function tilaSetDate(date) {
    console.log('Select Day');
    var i=0;
    for (i = 0; i < days.length; i++) {
        var compareDate = new Date(days[i]);
        if (compareDate.getDate() === date.getDate() &&
                compareDate.getMonth() === date.getMonth() &&
                compareDate.getFullYear() === date.getFullYear()) {
            currentDay = i;
            console.log('Found day' + i);
            changeDay("set");
            return;
        }
    }
}

function tilaIsDateAvailable(date,cellType) {
    if (!(date instanceof Date))
        return false;

    var i=0;
    for (i = 0; i < days.length; i++) {

        var compareDate = parseDate(days[i]);
        if(cellType ==='day'){
            if (compareDate.getDate() === date.getDate() &&
                compareDate.getMonth() === date.getMonth() &&
                compareDate.getFullYear() === date.getFullYear()) {
                //console.log("!Date available " + date.toString());
                return true;
            }
        }
        if(cellType ==='month'){
            if (compareDate.getMonth() === date.getMonth() &&
                compareDate.getFullYear() === date.getFullYear()) {
                //console.log("!Date available " + date.toString());
                return true;
            }
        }  
        if(cellType ==='year'){
            if (compareDate.getFullYear() === date.getFullYear()) {
                //console.log("!Date available " + date.toString());
                return true;
            }
        }         
    }
    return false;
}

function hideSubMenu(){
    $("#speedMenu").removeClass('tilaMenuShow');
    $("#videoMenu").removeClass('tilaMenuShow'); 
}

function hideMainMenu() {
    $("#moreMenu").removeClass('tilaMenuShow');
}

function showMainMenu() {
    $("#moreMenu").addClass("tilaMenuShow");
    hideSubMenu();
}

function showSpeedMenu(){
    $("#speedMenu").addClass('tilaMenuShow'); 
    hideMainMenu();
}

function showVideoMenu(){
     $("#videoMenu").addClass('tilaMenuShow'); 
    hideMainMenu();   
}

function createVideo(createMode){
    movieURI = "";
    hideSubMenu();
    $("#videoInfoContainer").addClass('tilaMenuShow');    
    $("#videoInfo").text("Video Created...");
    var day = days[currentDay];
    console.log('Create Video: '+createMode+' enddate: '+day+'')
    //ajax call to php file that creates the video and returns the filename
     $.get( serviceAddress, {action: "createVideo", mode: createMode, day: day} )
    .done(function( data ) {
        movieURI = data;
        console.log('Create Video finished: '+data);
        $("#videoInfo").text("Video Download");
    });  
}

function downloadMovie(){
   if (movieURI === '') 
       return;
   
   $("#videoInfoContainer").removeClass('tilaMenuShow');      
   $('#tilaDownload').attr("href", movieURI);
   $('#tilaDownload')[0].click(); //[0] dom object instead of jquery
}

function initTilacam() {
    displayFirstPicture();
    getAvailableDays();
    initSlider();
}

function updateSlider() {
    console.log('update Slider');
    console.log(' max value: ' + dayPictures.length);
    var inputRange = $('#timeSlider');
    inputRange.attr("max", dayPictures.length);
    $('#timeSlider').val(1).change();
    currentImage = 0;
    displayImage();
    fillImageCache();
    clearCache();     
    $('#timeSlider').rangeslider('update', true);
}

function setPlayerSpeed(factor){
   pictureDelay = Math.floor(origPictureDelay/factor);
   $("#speedMenu").removeClass('tilaMenuShow'); 
   console.log("Set delay to: "+pictureDelay);
}

function downloadCurrentPicture(){
   $('#tilaDownload').attr("href", dayPictures[currentPicture].name);
   $('#tilaDownload')[0].click(); //[0] dom object instead of jquery
}

function initSlider() {

    $('#timeSlider').rangeslider({
        // Feature detection the default is `true`.
        // Set this to `false` if you want to use
        // the polyfill also in Browsers which support
        // the native <input type="range"> element.
        polyfill: false,

        // Default CSS classes
        rangeClass: 'rangeslider',
        disabledClass: 'rangeslider--disabled',
        horizontalClass: 'rangeslider--horizontal',
        fillClass: 'rangeslider__fill',
        handleClass: 'rangeslider__handle',

        // Callback function
        onInit: function () {
            console.log("init slider");
            $rangeEl = this.$range;
            // add value label to handle
            var $handle = $rangeEl.find('.rangeslider__handle');
            var handleValue = '<div class="rangeslider__handle__value"></div>';
            $handle.append(handleValue);
        },

        // Callback function
        onSlide: function (position, value) {
            if (started) {
                stop();
                started = true;
            }
            var $handle = this.$range.find('.rangeslider__handle__value');
            var picture = dayPictures[value - 1];
            var timeText = picture.hour + ':' + picture.minute;
            $handle.text(timeText);
            var lastPicture = dayPictures[dayPictures.length - 1];
            var totalText = lastPicture.hour + ':' + lastPicture.minute;
            var pictureDate = dayPictures[currentPicture].formatedDateTime;
            var pd = parseDate(pictureDate);
            var dateOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
            var dateText = pd.toLocaleDateString("en", dateOptions);
            $("#pictureInfo").text(dateText + ' ' + timeText + ' / ' + totalText);
        },

        // Callback function
        onSlideEnd: function (position, value) {
            currentPicture = value - 1;
            displayImage();
            clearCache();
            fillImageCache();
            if (started)
                start();
        }
    });
}

function parseDate(stringDate){
    var containsTime = stringDate.indexOf(" ") >0;
    var datepart = stringDate;
    var timepart ='';
    var newDate = new Date();
    if(containsTime){
        datepart = stringDate.split(" ")[0];
        timepart = stringDate.split(" ")[1];
    }
    var dateSplit = datepart.split("-");
    newDate.setYear(dateSplit[0]);
    newDate.setMonth(dateSplit[1]-1);
    newDate.setDate(dateSplit[2]);
    if(containsTime){
        var timeSplit = timepart.split(":");
        newDate.setHours(timeSplit[0]);
        newDate.setMinutes(timeSplit[1]);
        newDate.setSeconds(timeSplit[2]);
    }     
    var parsedDate = newDate;
    //var parsedDate = new Date(stringDate);
    //console.log('Parse date: '+stringDate+' parsedDate '+parsedDate.toJSON());
    return parsedDate;
}

function toggleFullScreen() {
    var element = document.getElementById('imagePlayer');
    if (!document.fullscreenElement && // alternative standard method
            !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
        $("#fullscreenToggle").text("fullscreen_exit");
        isFullscreen = true;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        $("#fullscreenToggle").text("fullscreen");
        isfullscreen = false;
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
    fitPicture();
}

function clearCache(){
    imageBufferSize = imageBufferMaxSize;
    currentCacheNo = 0;
}

window.addEventListener("resize", fitPicture);

function fitPicture() {
    if (!autoResizeImage)
        return;
    
    var originalRatio = picturesWidth / picturesHeight;
    // console.log("Orig Picture x"+picturesWidth+" y "+picturesHeight+" ratio "+originalRatio);    
    
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    if(isEmbedded){
        console.log('Use Embedded div size');
        windowWidth = $('#tilacamDiv').width();
        if(windowWidth <200)
            windowWidth = 200;
        
        windowHeight = windowWidth/originalRatio;
    }


    console.log("Viewport width Picture x" + windowWidth + " y " + windowHeight);
    var newWidth;
    var newHeight;
    if (windowWidth >= windowHeight * originalRatio) {
        newHeight = windowHeight;
        newWidth = Math.floor(windowHeight * originalRatio);
    } else {
        newWidth = windowWidth;
        newHeight = Math.floor(windowWidth / originalRatio);
    }

    $(topImageContainer).css("height", newHeight);
    $(topImageContainer).css("width", newWidth);
    $(bottomImageContainer).css("height", newHeight);
    $(bottomImageContainer).css("width", newWidth);

    $("#sizeDiv").css("height", newHeight);
    $("#sizeDiv").css("width", newWidth);
}

var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

window.addEventListener(orientationEvent, function () {
    fitPicture();
}, false);

//automatic generate Tilacam Player
window.onload = function(){
    var functionName = 'setupTilacam';
    try {
        setupTilacam();
        buildTilacamPlayer();
    } catch (e) {        
     console.log('No setupTilacam funtion found.');
    }
    initTilacam();    
}

function buildTilacamPlayer(){
    var html = ` 
        <div id="imagePlayer">
            <div id="sizeDiv">
                <img id="topImage" src="empty.gif">
                <img id="bottomImage" src="empty.gif">
                <div class="navContainer tilaLeft" onclick="previousPicture()"><div class="navIconContainer "><i class="navigationIcons">navigate_before</i></div></div>
                <div class="navContainer tilaRight" onclick="nextPicture()"><div class="navIconContainer"><i class="navigationIcons">navigate_next</i></div></div>
                <div id="controlPlayer">
                    <div id="pictureInfo" onclick="showDatePicker()">info</div>
                    <div class="cp-table" style="width: 100%">
                        <div class="cp-row">
                            <div class="cp-cell">
                                <i id="playPause" class="tilaIcons" onclick="togglePlay()">play_arrow</i>
                            </div>
                            <div class="cp-cell" style="width: 100%">
                                <div class="rangeslider-wrap">
                                    <input id="timeSlider" type="range" min="1" max="100" step="1" value="1">
                                </div>
                            </div>
                            <div class="cp-cell" onclick="showMainMenu()">
                                <i class="tilaIcons">more_vert</i>
                            </div>
                            <div class="cp-cell">
                                <i id="fullscreenToggle" class="tilaIcons" onclick="toggleFullScreen()">fullscreen</i>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="videoInfoContainer" class="tilaMenu" style="width:200px; height: 45px">
                   <div id="videoInfo" class="tilaMenuItem" onclick="downloadMovie()">info</div>
                </div>                  
                <div id="moreMenu" class="tilaMenu">
                    <div class="tilaMenuItem" onclick="showDatePicker()"><span class="tilaIcons">calendar_today</span> Calendar<input id="tilaHiddenDate" type="text" style="display: none"></div>
                    <div class="tilaMenuItem" onclick="showSpeedMenu()"><span class="tilaIcons">shutter_speed</span> Playback Speed</div>
                    <div class="tilaMenuItem" onclick="downloadCurrentPicture()"><span class="tilaIcons">file_download</span> Download</div>
                    <div class="tilaMenuItem" onclick="showVideoMenu()"><span class="tilaIcons">videocam</span> Video</div>
                </div>
                <div id="speedMenu" class="tilaMenu" style="width: 100px">
                    <div class="tilaMenuItemSmall" onclick="setPlayerSpeed(0.25)">1/4</div>
                    <div class="tilaMenuItemSmall" onclick="setPlayerSpeed(0.5)">1/2</div>
                    <div class="tilaMenuItemSmall" onclick="setPlayerSpeed(1)">Standard</div>
                    <div class="tilaMenuItemSmall" onclick="setPlayerSpeed(2)">2x</div>
                    <div class="tilaMenuItemSmall" onclick="setPlayerSpeed(4)">4x</div>
                    <div class="tilaMenuItemSmall" onclick="setPlayerSpeed(8)">8x</div>
                </div>
                <div id="videoMenu" class="tilaMenu" style="width: 150px">
                    <div class="tilaMenuItem" onclick="createVideo('day')">Day</div>
                    <div class="tilaMenuItem" onclick="createVideo('week')">Week</div>
                    <div class="tilaMenuItem" onclick="createVideo('month')">Month</div>
                    <div class="tilaMenuItem" onclick="createVideo('all')">All</div>
                </div>                

                <div id="datepicker-inline" class=""></div>
            </div>
        </div>
        <a  style="display: none" id="tilaDownload" href="" download></a>            
        `;
    $('#tilacamDiv').html(html);    
    isEmbedded = true;
}
