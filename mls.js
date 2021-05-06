const mls2D = function(controlPoints,outputPoints,stationPoints)
{
	let miu;

	//与源控制点的距离求得的权重
	let weights = new Map();
	let weightsSum;
	let outputGraph = new Object();

	for(let i = 0; i < height; ++ i) {
		for(let j = 0; j < width; ++ j) {
			let pointIndex = width * i + j;
			if(!controlPoints.has(pointIndex)) {
				//不属于控制点

				//求加权重心p*, q*，权重值保存起来后面还有用
				let pCentroidX = 0;
				let pCentroidY = 0;
				let qCentroidX = 0;
				let qCentroidY = 0;
				weightsSum = 0;
				for(let [controlPointIndex, controlPointDst] of controlPoints) {
					let px = controlPointIndex % width;//横向第几个
					let py = Math.floor(controlPointIndex / width);//竖向第几个
					let qx = controlPointDst[0];//空间位置x
					let qy = controlPointDst[1];//空间位置y
					let weight = 1 / ((j - px) * (j - px) + (i - py) * (i - py));
					weights.set(controlPointIndex, weight);//每个index的权重记录一下
					weightsSum += weight;
					pCentroidX += weight * px;//全都加权
					pCentroidY += weight * py;
					qCentroidX += weight * qx;
					qCentroidY += weight * qy;
				}
				pCentroidX /= weightsSum; //总而言之在加权
				pCentroidY /= weightsSum;
				qCentroidX /= weightsSum;
				qCentroidY /= weightsSum;

				//计算M
				let s1 = 0;
				let s2 = 0;
				let m00 = 0;
				let m01 = 0;
				let m10 = 0;
				let m11 = 0;
				for(let [controlPointIndex, controlPointDst] of controlPoints) {
					let px = controlPointIndex % width;
					let py = Math.floor(controlPointIndex / width);
					let qx = controlPointDst[0];
					let qy = controlPointDst[1];

					let dQx = qx - qCentroidX;
					let dQy = qy - qCentroidY;
					let dPx = px - pCentroidY;
					let dPy = py - pCentroidY;
					let weight = weights.get(controlPointIndex);
					s1 += (dQx * dPx + dQy * dPy) * weight;
					s2 += (dQx * (-dPy) + dQy * dPx) * weight;

					m00 += (dPx * dQx + dPy * dQy) * weight;
					m01 += (dPx * dQy - dPy * dQx) * weight;
					m10 += (dPy * dQx - dPx * dQy) * weight;
					m11 += (dPy * dQy + dPx * dQx) * weight;
				}
				let miu = Math.sqrt(s1 * s1 + s2 * s2);
				m00 /= miu;
				m01 /= miu;
				m10 /= miu;
				m11 /= miu;


				outputGraph[pointIndex] = {x:(j - pCentroidX) * m00 + (i - pCentroidY) * m10 + qCentroidX, y:(j - pCentroidX) * m01 + (i - pCentroidY) * m11 + qCentroidY }
				// for(let index = 0; index < Object.keys(outputPoints).length; index++){
				// 	console.log('hi')
				// 	if(outputPoints[index].i === pointIndex){
				// 		outputPoints[index].x = (j - pCentroidX) * m00 + (i - pCentroidY) * m10 + qCentroidX;
				// 		outputPoints[index].y = (j - pCentroidX) * m01 + (i - pCentroidY) * m11 + qCentroidY;
				// 	}
				// }

				
			}
			if(controlPoints.has(pointIndex)) {
				console.log('hi')
				outputGraph[pointIndex] = {x: controlPoints.get(pointIndex)[0], y: controlPoints.get(pointIndex)[1]}
				console.log(controlPoints.get(pointIndex)[0])
			}
		}
	}

	for (let i = 0; i < Object.keys(outputPoints).length; i++){
		let pt = outputPoints[i].i; 
		outputPoints[i].x = outputGraph[pt].x + stationPoints[homeStationId].x;
		outputPoints[i].y = outputGraph[pt].y + stationPoints[homeStationId].y;
	}
	console.log(outputGraph,outputPoints)
}