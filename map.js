
let maxTravelTime = 50 ;

let { lines, stations} = subway;
let { points, curves } = manhattan;

let width = height = 100;// 1:1比例

window.travelTimes = null;
let defaultStop = '127'; // times sq

const svg = d3.select("body").append("svg").attr("viewBox", '0 0 ' + width + ' ' + height);
const container = svg.append('g');
const zoom = d3.zoom().scaleExtent([1, 10]).on("zoom",  ({transform}) => {container.attr("transform", transform)});

let grid = {};//辅助集合：索引-图中位置
for(let i = 0; i < (width * height); i++){
	grid[i] = {x:i % width, y: Math.floor(i / width)}
}

const data2Points = function(data){
	let scaleX = d3.scaleLinear().domain([-74.1,-73.8]).range([0,height]);
	let scaleY = d3.scaleLinear().domain([40.6,40.9]).range([0,width]);

	let points = {}, pointsInGrid = {};
	for(let index of Object.keys(data)){
		let {lat, lon} = data[index];
		points[index] = {x : scaleX(lon), y: height - scaleY(lat)}
	};

	for(let index of Object.keys(points)){
		let px = points[index].x;
		let py = points[index].y;

		for(let i of Object.keys(grid)){

			let qx = grid[i].x;
			let qy = grid[i].y;
			let deltax = px - qx, deltay = py - qy;
			let dist = Math.sqrt((Math.pow(deltax, 2) + Math.pow(deltay, 2)));
			if(dist <= Math.sqrt(2)){
				pointsInGrid[index] = {i: i, x : Object.values(grid[i])[0], y : Object.values(grid[i])[1]};
			}
		}
	}
	return pointsInGrid;
}

const updateControlPoints = function(originStationId, travelTimes, stationPoints) {
	let originX = stationPoints[originStationId].x;
	let originY = stationPoints[originStationId].y
		
	let controlPoints = new Map();
	for (let stationId of Object.keys(stationPoints)) {

		let deltaX = stationPoints[stationId].x - originX;
		let deltaY = stationPoints[stationId].y - originY;

		let angle = Math.atan2(deltaY, deltaX) 
		let origDist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));//距离哦
		
		let dist = travelTimes ? (travelTimes[stationId]) / maxTravelTime : origDist * 5;
		controlPoints.set(parseFloat(stationPoints[stationId].i), [Math.cos(angle) * dist + originX , Math.sin(angle) * dist + originY]);//向量

		stationPoints[stationId].x = Math.cos(angle) * dist + originX ;
		stationPoints[stationId].y = Math.sin(angle) * dist + originY;
	}//圆心的问题

	return controlPoints;
}

let tooltip = d3.select('body').append('div').attr('class','tooltip')

let shouldHideTooltip = true;
const addClickHandlers = (selection) => {
	selection.on('click',(d,i)=>{
		setHomeStationId(i)
		console.log(d,i)
	}).on('mouseover', (e,d) => {
		tooltip.style("top", (e.pageY + 10) + "px").style("left", (e.pageX + 10) + "px").attr('display','block');
		document.querySelector('.tooltip').display = 'block';
		document.querySelector('.tooltip').innerHTML = "<h1>" + stations[d].name + "</h1>";
}).on('mouseleave',()=>{
	document.querySelector('.tooltip').display = 'none'
})
}


   //画图
   const drawSubway = function(data1,data2){
	let xMap =  (d) => data1[d].x;
	let yMap =  (d) => data1[d].y;

	//背景部分

	let lineFunc2 = d3.line().x((d) => data2[d].x).y((d) => data2[d].y);
	let lineSelection2 = container.selectAll('.curve').data(Object.values(curves));
	lineSelection2.enter().append('path').attr('class', 'curve').attr('fill', (l) => l.color).attr('stroke-width', 0.5).merge(lineSelection2).attr('d', (d) => { return lineFunc2(d.points) } )

	//地铁部分 地铁线路
	let lineFunc = d3.line().x((d) => data1[d].x).y((d) => data1[d].y).curve(d3.curveNatural);
	let lineSelection = container.selectAll('.line').data(Object.values(lines));
	lineSelection.enter().append('path').attr('class', 'line').attr('stroke', (l) => l.color).attr('stroke-width', 0.5).merge(lineSelection).attr('d', (d) => { return lineFunc(d.stations) } ).attr('fill', 'none');
	//
	//地铁部分 地铁站点
	let stopSelection = container.selectAll('.stop').data(Object.keys(data1));
	let merged = stopSelection.enter().append('circle').attr('class', 'stop').attr('r', '1').attr('fill', 'black').merge(stopSelection);
		merged.transition().attr('cx', d => data1[d].x).attr('cy', d => data1[d].y);
		addClickHandlers(merged)

}

// const drawManhattan = function(data){
// 	let lineFunc = d3.line().x((d) => data[d].x).y((d) => data[d].y);
// 	let lineSelection = container.selectAll('.curve').data(Object.values(curves));
// 	lineSelection.enter().append('path').attr('class', 'curve').attr('fill', (l) => l.color).attr('stroke-width', 0.5).attr('d', (d) => { return lineFunc(d.points) } )
// }

let updateMap = (homeStationId, schedule) => {
	console.log(homeStationId, schedule)
	if (homeStationId) {
		document.getElementById('initial').style.display = 'none';
		document.getElementById('explanation').style.display = 'block';
		console.log(homeStationId)
	}
	let stationPoints, otherPoints;
	if (homeStationId && schedule) {
		console.log(homeStationId, schedule)
		let processSchedule = (schd) => {
			let times = _computeTravelTimes(homeStationId, Object.keys(subway.stations), gtfs_transfers, schd.events, schd.start_time);
			window.travelTimes = times;

			stationPoints = data2Points(stations);
			otherPoints = data2Points(points);
			mls2D((updateControlPoints(homeStationId, times, stationPoints)),otherPoints,stationPoints)
			drawSubway(stationPoints,otherPoints);

		}
		processSchedule(schedule)
	
		// let scheduleCache = {};
		// if (scheduleCache[schedule]) {
		// 	processSchedule(scheduleCache[schedule])
		// } else {
		// 	d3.json('/Projects/timespace map/schedules/' + schedule + '.json', (schedule) => {
		// 		console.log("b");
		// 		console.log(schedule);
		// 		scheduleCache[schedule] = schedule;
		// 		processSchedule(schedule);
		// 	})
		// }
		// computeTravelTimes(homeStationId, schedule, (times) => {
		// 	window.travelTimes = times;
		// 	// setStationPositions(computeStationPositions(homeStationId, times));
		// 	// let stationPoints = data2Points(stations);
		// 	// let otherPoints = data2Points(points);
		// 	console.log('hi')
		// 	drawSubway(stationPoints,mls2D(updateControlPoints(homeStationId, times, data2Points(stations)), data2Points(points)));
		// 	// drawManhattan(otherPoints);
        // 	// drawSubway(stationPoints);
		// })
	} 
	// let computeTravelTimes = (startStationId, scheduleName, callback) => {
	// 	getSchedule(scheduleName, (schedule) => {
	// 		callback(_computeTravelTimes(startStationId, Object.keys(subway.stations), gtfs_transfers, schedule.events, schedule.start_time));
	// 	});
	// };

	// let getSchedule = (name, callback) => {
	// 	if (scheduleCache[name]) {
	// 		callback(scheduleCache[name]);
	// 	} else {
	// 		d3.json('/Projects/timespace map/schedules/' + name + '.json', (schedule) => {
	// 			scheduleCache[name] = schedule;
	// 			callback(schedule);
	// 		})
	// 	}
	// }
	else {
		// setStationPositions(computeStationPositions(null, null));
		stationPoints = data2Points(stations);
		otherPoints = data2Points(points);

		// mls2D(updateControlPoints(defaultStop, window.travelTimes, stationPoints),otherPoints);
		// drawManhattan(otherPoints);
        drawSubway(stationPoints,otherPoints);
	}
}

window.homeStationId = null;
window.schedule = weekday_8am;

let setSchedule = (schedule) => {
	window.schedule = schedule;
	updateMap(window.homeStationId, window.schedule);
}
let setHomeStationId = (homeStationId) => {
	window.homeStationId = homeStationId;
	console.log(window.homeStationId, window.schedule)
	updateMap(window.homeStationId, window.schedule);
}

updateMap(null, null);
// preload 8am:
// getSchedule(window.schedule, (data) => {});


$(() => {
	$('#timePicker li').click((e) => {
		let schedule = e.target.getAttribute('data-schedule');
		$('#timePicker li').removeClass('selected');
		$(e.target).addClass('selected');
		setSchedule(schedule);
	})
})
