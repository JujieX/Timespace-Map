
let atStopState = (id) => "at_stop:" + id;
let onTripState = (id) => "on_trip:" + id;

let MAX_TIME = 1000 * 60;

class StateMap {
	constructor() {
		this.earliestRidersAtStates = {};//维持的状态
	}
	addRider(rider) {
		let existing = this.earliestRidersAtStates[rider.state];//最后一个时间
		if (!existing || rider.time < existing.time) {
			this.earliestRidersAtStates[rider.state] = rider;//加上这个rider
			return true;
		}
		return false;
	}
	addRiderAndTransfersByAppendingStop(oldRider, stopId, time, allTransfers) {
		let direct = oldRider.byAdding(atStopState(stopId), time);//【at_stop : id] ,time
		if (this.addRider(direct)) {
			// add all transfers:
			for (let transfer of allTransfers[stopId] || []) {//||是啥啊！
				this.addRiderAndTransfersByAppendingStop(direct, transfer['to'], time + transfer.time, allTransfers);//不该写transfer.to吗？
			}
		}
	}
}

class Rider {//[]和时间 的一个rider合集 this.state是啥呢
	constructor(states, time) {
		this.states = states; // states are strings
		this.time = time;
		this.state = states.length ? states[states.length-1] : null;//最后一个
	}
	byAdding(state, finalTime) {
		return new Rider([...this.states, state], finalTime);//产生了一个新rider
	}
}

let _computeTravelTimes = (startStationId, endStationIds, transfers, events, startTime) => {
	let stateMap = new StateMap();
	
	let emptyPath = new Rider([], startTime);
	stateMap.addRiderAndTransfersByAppendingStop(emptyPath, startStationId, startTime, transfers);
	// console.log(stateMap);
	
	for (let {time, trip_id, stop_id, route_name} of events) {
		// model exiting the train:
		let riderOnTrain = stateMap.earliestRidersAtStates[onTripState(trip_id)];
		if (riderOnTrain && riderOnTrain.time <= time) {
			stateMap.addRiderAndTransfersByAppendingStop(riderOnTrain, stop_id, time, transfers);
		}
		// model boarding the train:
		let riderOnPlatform = stateMap.earliestRidersAtStates[atStopState(stop_id)];
		if (riderOnPlatform && riderOnPlatform.time <= time) {
			let riderOnTrain = riderOnPlatform.byAdding(onTripState(trip_id), time);
			stateMap.addRider(riderOnTrain);
		}
	}
	
	let travelTimes = {};
	for (let stationId of endStationIds) {
		let rider = stateMap.earliestRidersAtStates[atStopState(stationId)];
		travelTimes[stationId] = rider ? rider.time - startTime : MAX_TIME;
	}
	console.log(travelTimes)
	return travelTimes;
}


let scheduleCache = {};
let getSchedule = (name, callback) => {
	if (scheduleCache[name]) {
		callback(scheduleCache[name]);
	} else {
		d3.json('/Projects/timespace map/schedules/' + name + '.json', (schedule) => {
			scheduleCache[name] = schedule;
			callback(schedule);
		})
	}
}
let computeTravelTimes = (startStationId, scheduleName, callback) => {
	getSchedule(scheduleName, (schedule) => {
		callback(_computeTravelTimes(startStationId, Object.keys(subway.stations), gtfs_transfers, schedule.events, schedule.start_time));
	});
};

// let HOURS = 60 * 60;
// console.log(computeTravelTimes('127', Object.keys(subway.stations), 8*HOURS, gtfs_json, 'weekdays'));
