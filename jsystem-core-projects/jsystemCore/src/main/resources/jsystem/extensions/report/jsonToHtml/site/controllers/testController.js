/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var idIndex = 0;
var levelsTracker;

function LevelInfo(rowId, levelDepth) {
    this.rowId = rowId;
    this.levelDepth = levelDepth;
}

function ReportLevelsTracker() {

    // Array for objects of type: {children: []}
    // Used to map a level row ID (the outer array's index) to its direct
    // children (stored in the "children" array
    this.levelsChildrenMap = [];
    
    // Array to be populated by the row IDs of all the descendants (children
    // and children's children...) of a given level (see the "getLevelDescendants" method)
    this.levelDescendantIds = [];
    
    // Auto-incremented integer to be used as a unique ID assigned to every table row
    // (every report element except for elements of type "stopLevel")
    this.currentRowId = 0;
    
     // Integer specifying the "depth" of the current element -
     // how deep it is nested in the report levels system
    this.currentLevelDepth = 0;
    
     // A stack data structure to keep the "path" to the current current level.
     // Keeps the the row IDs on the path to the current "Start Level" 
    this.levelsStack = [];
}

ReportLevelsTracker.prototype.addChildToLevel = function(childRowId) {
    
    if (this.levelsStack.length > 0) {
        var currLevelId = this.levelsStack[this.levelsStack.length - 1];
        this.levelsChildrenMap[currLevelId].children.push(childRowId);
    }
};

ReportLevelsTracker.prototype.registerReportElement = function(reportElement) {

    var elementType = reportElement.type;

    // START LEVEL
    if (elementType === "startLevel") {
        this.currentRowId++;
        this.currentLevelDepth++;
        this.addChildToLevel(this.currentRowId);
        this.levelsStack.push(this.currentRowId);
        this.levelsChildrenMap[this.currentRowId] = {children: []};
        return new LevelInfo(this.currentRowId, this.currentLevelDepth);
    }

    // STOP LEVEL
    else if (elementType === "stopLevel") {
        this.currentLevelDepth--;
        this.levelsStack.pop();
        return null;
    }

    // OTHER TYPES
    else {
        this.currentRowId++;
        this.addChildToLevel(this.currentRowId);
        return new LevelInfo(this.currentRowId, this.currentLevelDepth);
    }
};

ReportLevelsTracker.prototype.findLevelDescendants = function(levelId) {
    
    if (this.levelsChildrenMap[levelId] !== undefined) {
        var children = this.levelsChildrenMap[levelId].children;
        
        for (var i = 0; i < children.length; i++) {
            this.levelDescendantIds.push(children[i]);
            this.findLevelDescendants(children[i]);
        }
    }
};

ReportLevelsTracker.prototype.getLevelDescendants = function(levelId) {

    this.levelDescendantIds = [];
    this.findLevelDescendants(levelId);
    return this.levelDescendantIds;
};

//=========================================================


function setFixedProperties(element) {
    $(element).find("#name").text(test.name);
    $(element).find("#timestamp").text(test.timestamp);
    $(element).find("#description").text(test.description);

}

function addPropertiesToTbl(properties, table) {
    for (var key in properties) {
        var tr = $('<tr>');
        tr.append($('<td>').text(key));
        tr.append($('<td>').text(properties[key]));
        $(table).append(tr);
    }
}

function setCustomProperties(element) {
    addPropertiesToTbl(test.properties, $(element).find("#propTbl > tbody"));
}

function setParameters(element) {
    addPropertiesToTbl(test.parameters, $(element).find("#paramTbl > tbody"));

}

function createDetailsTable() {
    var table = $("<table>");
    $(table).addClass("detailsTbl").append("<tbody>");
    return table;

}

function addToggleElement(table, toggle, toggled, startAsOpened) {
    var id = "toggled_" + idIndex++;
    $(toggle).click(function() {
        doToggle(id);
    });
    $(toggle).addClass("toggle");
    $(toggled).attr("id", id).find("td").attr("colspan", "2");
    if (startAsOpened) {
        toggled.show();
    } else {
        toggled.hide();
    }
    $(table).append(toggle);
    $(table).append(toggled);
}

function isPropertyExist(element, property) {
    return (element.hasOwnProperty(property) && element[property] !== null && element[property] !== "");
}

function addStatusAsClass(elementToAppend, elementWithStatus) {
    if (isPropertyExist(elementWithStatus, "status")) {
        elementToAppend.addClass(elementWithStatus.status);
    }
}

function setRegularElement(table, element) {
    
    var levelInfo = levelsTracker.registerReportElement(element);
    
    var tr = $("<tr>");
    tr.attr("rowId", levelInfo.rowId);
    tr.attr("levelDepth", levelInfo.levelDepth);
    
    tr.append($('<td>').text(element.time));
    
    if (isPropertyExist(element, "message")) {
        tr.append($('<td>').text(element.title));
        addStatusAsClass(tr, element);
        var messageTr = $("<tr>");
        messageTr.append($('<td>').text(element.message));
        addToggleElement(table, tr, messageTr, false);

    } else {
        var indentation = indentationStrByLevelDepth(element, levelInfo.levelDepth);
        tr.append($('<td>').html(indentation + element.title));
        addStatusAsClass(tr, element);
        $(table).append(tr);
    }
}

function setStartLevelElement(table, element) {

    var levelInfo = levelsTracker.registerReportElement(element);

    var tr = $("<tr>");
    tr.attr("rowId", levelInfo.rowId);
    tr.attr("levelDepth", levelInfo.levelDepth);
    tr.addClass("startLevel");

    tr.append($('<td>').text(element.time));

    var indentation = indentationStrByLevelDepth(element, levelInfo.levelDepth);
    tr.append($('<td>').html(indentation + element.title));
    addStatusAsClass(tr, element);
    $(table).append(tr);
}

function setStopLevelElement(element) {
    levelsTracker.registerReportElement(element);
}

function setStepElement(table, element) {
    
    var levelInfo = levelsTracker.registerReportElement(element);
    
    var tr = $("<tr>");
    tr.attr("rowId", levelInfo.rowId);
    tr.attr("levelDepth", levelInfo.levelDepth);
    
    tr.append($('<td>').text(element.time));
    
    var indentation = indentationStrByLevelDepth(element, levelInfo.levelDepth);
    tr.append($('<td>').html(indentation + element.title));
    tr.addClass("step");
    addStatusAsClass(tr, element);
    $(table).append(tr);
}

function setImageElement(table,element){
    
    var levelInfo = levelsTracker.registerReportElement(element);
    
    var tr = $("<tr>");
    tr.attr("rowId", levelInfo.rowId);
    tr.attr("levelDepth", levelInfo.levelDepth);
    
    tr.append($('<td>').text(element.time));
    var img = $("<img>").attr("src",element.message).addClass("example-image").attr("alt",element.title);
    var a = $("<a>").attr("href",element.message).attr("data-lightbox","image-1").attr("title",element.title);
    a.append(img);
    var td = $("<td>");
    td.append(a);
    tr.append(td);
    $(table).append(tr);
}

function setLinkElement(table, element) {
    
    var levelInfo = levelsTracker.registerReportElement(element);
    
    var tr = $("<tr>");
    tr.attr("rowId", levelInfo.rowId);
    tr.attr("levelDepth", levelInfo.levelDepth);
    
    var indentation = indentationStrByLevelDepth(element, levelInfo.levelDepth);
    
    tr.append($('<td>').text(element.time));
    if (isPropertyExist(element, "message")) {
        tr.append($('<td>').append($('<a>').text(element.title).attr("href", element.message)));
    } else {
        tr.append($('<td>').text(indentation + element.title));
    }
    $(table).append(tr);
}

function setReportElements(table, reportElements) {
    
    levelsTracker = new ReportLevelsTracker();
    
    $(reportElements).each(function() {
        switch (this.type) {
            case "startLevel":
                setStartLevelElement(table, this);
                break;
            case "stopLevel":
                setStopLevelElement(this);
                break;
            case "lnk":
                setLinkElement(table, this);
                break;
            case "step":
                setStepElement(table, this);
                break;
            case "img":
                setImageElement(table,this);
                break;
            default:
                setRegularElement(table, this);
                break;
        }
    });
    
    prepareLevels();
}

function testController(element) {
    setFixedProperties(element);
    setCustomProperties(element);
    setParameters(element);
    setReportElements($(element).find(".detailsTbl:first"), test.reportElements);

}

function doToggle(id) {
    $("#" + id).toggle(200);
}

function indentationStrByLevelDepth(element, levelDepth) {

    var indentation = "";
    if (element.type === "startLevel") {
        levelDepth--;
    }

    for (var i = 0; i < levelDepth; i++) {
        indentation += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    }
    return indentation;
}

function prepareLevels() {
    
    // Hide all levels content
    $('tr.startLevel').each(function() {
        
        var currentLevelId = $(this).attr("rowId");
        var levelDescendantIds = levelsTracker.getLevelDescendants(currentLevelId);
        
        for (var i=0; i<levelDescendantIds.length; i++) {
            $("tr[rowId=" + levelDescendantIds[i] + "]").hide();    
        }
    });
    
    // Toggle level content visibility on click
    $(".startLevel").click(function() {

        var clickedLevelDepth = parseInt($(this).attr("levelDepth"));
        var clickedLevelId = $(this).attr("rowId");
        var levelDescendantIds = levelsTracker.getLevelDescendants(clickedLevelId);

        for (var i = 0; i < levelDescendantIds.length; i++) {

            var descendantRow = $("tr[rowId=" + levelDescendantIds[i] + "]");
            var descendantRowDepth = parseInt($(descendantRow).attr("levelDepth"));

            if (descendantRowDepth === clickedLevelDepth) {
                $(descendantRow).toggle();
            }
            else if (descendantRowDepth === (clickedLevelDepth + 1) && $(descendantRow).attr("class") === "startLevel") {
                $(descendantRow).toggle();
            }
            else if ((descendantRowDepth > clickedLevelDepth && $(descendantRow).is(":visible"))) {
                $(descendantRow).hide();
            }
        }
    });
}