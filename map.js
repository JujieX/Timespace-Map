
let maxTravelTime = 60 * 0.4 ;

let { lines, stations} = subway;
let { points, curves } = manhattan;

let width = height = 200;// 1:1比例

window.travelTimes = null;
let defaultStop = '127'; // times sq

const svg = d3.select("body").append("svg").attr("viewBox", '0 0 ' + width + ' ' + height);
const container = svg.append('g');

const zoom = d3.zoom().scaleExtent([0.7, 5]).on("zoom", (e) => {
	container.attr("transform", e.transform);
	container.selectAll('.stop').attr('r', (2.0 / e.transform.k));
	container.selectAll('.home').attr('r', (3.0 / e.transform.k));
  });

svg.call(zoom);


let halfhourLine = container.append("circle").attr("class", "hour").attr("cx", width/2).attr("cy", height/2).attr('r', 60*60/maxTravelTime * 0.5 ).attr("hidden",true)//0.5 hour
let onehourLine = container.append("circle").attr("class", "hour").attr("cx", width/2).attr("cy", height/2).attr('r', 60*60/maxTravelTime ).attr("hidden",true)//1 hour


let grid = {};//辅助集合：索引-图中位置
for(let i = 0; i < (width * height); i++){
	grid[i] = {x : i % width, y: Math.floor(i / width)}
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

		let angle = Math.atan2(deltaY, deltaX) //- 30 / 180 * Math.PI;
		let origDist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
		
		let dist = travelTimes ? (travelTimes[stationId]) / maxTravelTime : origDist * 5;
		controlPoints.set(parseFloat(stationPoints[stationId].i), [Math.cos(angle) * dist + width/2, Math.sin(angle) * dist + height/2]);//向量

		stationPoints[stationId].x = Math.cos(angle) * dist + width/2  ;
		stationPoints[stationId].y = Math.sin(angle) * dist + height/2 ;
	}//圆心问题
	return controlPoints;
}

//画图tooltip
let tooltip = d3.select('body').append('div').attr('class','tooltip').attr("hidden",true);

let shouldHideTooltip = true;
const addClickHandlers = (selection) => {
	selection.on('click',(d,i)=>{
		setHomeStationId(i)
		halfhourLine.attr("hidden",null)
	}).on('mouseover', (e,d) => {
		tooltip.style("top", (e.pageY + 10) + "px").style("left", (e.pageX + 10) + "px").attr("hidden",null);
		let subwayInfo = "<strong>" + stations[d].name + "</strong><br/>";
		if (travelTimes) {
			let minutesAway = (travelTimes[d] / 60 | 0);
			subwayInfo += minutesAway + ' minutes away';
		}	
		document.querySelector('.tooltip').innerHTML = subwayInfo;
}).on('mouseout',()=>{
	tooltip.attr("hidden",true);
})
}


   //画图
   const drawSubway = function(data1,data2){
	//背景部分

	let lineFunc2 = d3.line().x((d) => data2[d].x).y((d) => data2[d].y);
	let lineSelection2 = container.selectAll('.curve').data(Object.values(curves));
	lineSelection2.enter().append('path').attr('class', 'curve').attr('fill', (l) => l.color).merge(lineSelection2).attr('d', (d) => { return lineFunc2(d.points) } )

	//地铁部分 地铁线路
	let lineFunc = d3.line().x((d) => data1[d].x).y((d) => data1[d].y).curve(d3.curveNatural);
	let lineSelection = container.selectAll('.line').data(Object.values(lines));
	lineSelection.enter().append('path').attr('class', 'line').attr('stroke', (l) => l.color).attr('stroke-width', 1).merge(lineSelection).attr('d', (d) => { return lineFunc(d.stations) } ).attr('fill', 'none');
	//
	//地铁部分 地铁站点
	let stopSelection = container.selectAll('.stop').data(Object.keys(data1));
	let merged = stopSelection.enter().append('circle').attr('class', 'stop').attr('r', '1').attr('fill', 'black').merge(stopSelection);
		merged.transition().attr('cx', d => data1[d].x).attr('cy', d => data1[d].y);
		addClickHandlers(merged)

	let homeSelection = container.selectAll('.home').data([1]);
	merged = homeSelection.enter().append('circle').attr('class', 'home').attr('r', '3').attr('fill', 'white').attr('stroke', 'black').attr('stroke-width', 2).merge(homeSelection);
	merged.transition().attr('cx', width/2).attr('cy', height/2);
	addClickHandlers(merged);

}

let updateMap = (homeStationId, schedule) => {
	if (homeStationId) {
		document.getElementById('initial').style.display = 'none';
		document.getElementById('explanation').style.display = 'block';
	}
	let stationPoints, otherPoints;
	if (homeStationId && schedule) {	
		let times = _computeTravelTimes(homeStationId, Object.keys(subway.stations), gtfs_transfers, schedule.events, schedule.start_time);
		window.travelTimes = times;

		stationPoints = data2Points(stations);
		otherPoints = data2Points(points);
		mls2D((updateControlPoints(homeStationId, times, stationPoints)),otherPoints);

		drawSubway(stationPoints,otherPoints);
	}else {
		stationPoints = data2Points(stations);
		otherPoints = data2Points(points);

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
getSchedule(window.schedule, (data) => {});


$(() => {
	$('#timePicker li').click((e) => {
		let schedule = eval(e.target.getAttribute('data-schedule'));
		$('#timePicker li').removeClass('selected');
		$(e.target).addClass('selected');
		setSchedule(schedule);
	})
})
