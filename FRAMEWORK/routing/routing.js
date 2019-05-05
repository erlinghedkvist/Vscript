let canvas = document.getElementById("canvas");

let instance = window.jsp = jsPlumb.getInstance({
	DragOptions: { cursor: "pointer", zIndex: 2000 },
	Container: "canvas"
});

let connectorPaintStyle = {
		video: {
			strokeWidth: 2,
			stroke: "#61B7CF",
			joinstyle: "round",
			outlineStroke: "white",
			outlineWidth: 2,
		},
		audio: {
			strokeWidth: 2,
			stroke: "#434343",
			joinstyle: "round",
			outlineStroke: "white",
			outlineWidth: 2,
			dashstyle: "2 4"
		}
	},
	connectorHoverStyle = {
		strokeWidth: 3,
		stroke: "#216477",
		outlineWidth: 5,
		outlineStroke: "white"
	},
	endpointHoverStyle = {
		video: {
			fill: "#216477",
			stroke: "#216477"
		},
		audio: {
			fill: "#346789",
			stroke: "#346789"
		}
	},
	sourceEndpoint = {
		video: {
			scope: "video",
			endpoint: "Dot",
			cssClass: "video-endpoint",
			connectorClass: "video-connector",
			paintStyle: {
				stroke: "#7AB02C", 
				fill: "#7AB02C",
				radius: 8,
				strokeWidth: 1
			},
			isSource: true,
			maxConnections: -1,
			connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: false } ],
			connectorStyle: connectorPaintStyle.video,
			hoverPaintStyle: endpointHoverStyle.video,
			connectorHoverStyle: connectorHoverStyle,
			dragOptions: {},
			overlays: [
			],
			connectorOverlays: [
				[ "Arrow", { width:15, length:10, location:0.45, id:"arrow" } ], 
			]
		},
		audio: {
			scope: "audio",
			endpoint: "Rectangle",
			cssClass: "audio-endpoint",
			connectorClass: "audio-connector",
			paintStyle: {
				stroke: "#346789",
				fill: "#346789",
				height: 16, 
				width: 16,
				strokeWidth: 1
			},
			isSource: true,
			maxConnections: -1,
			connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: false } ],
			connectorStyle: connectorPaintStyle.audio,
			hoverPaintStyle: endpointHoverStyle.audio,
			connectorHoverStyle: connectorHoverStyle,
			dragOptions: {},
			overlays: [
			],
			connectorOverlays: [
				[ "Arrow", { width:15, length:10, location:0.55, id:"arrow" } ], 
			]
		}
	},
	targetEndpoint = {
		video: {
			scope: "video",
			endpoint: "Dot",
			cssClass: "video-endpoint",
			paintStyle: { fill: "#7AB02C", radius: 8 },
			hoverPaintStyle: endpointHoverStyle.video,
			maxConnections: 1,
			dropOptions: { hoverClass: "hover", activeClass: "active" },
			isTarget: true,
			overlays: [
			]
		},
		audio: {
			scope: "audio",
			endpoint: "Rectangle",
			cssClass: "audio-endpoint",
			paintStyle: { fill: "#346789", height: 16, width: 16 },
			hoverPaintStyle: endpointHoverStyle.audio,
			maxConnections: 1,
			dropOptions: { hoverClass: "hover", activeClass: "active" },
			isTarget: true,
			overlays: [
			]
		},
	};

	
let _addEndpoints = function (toId, sourceAnchors, targetAnchors, params) {
	for (let i = 0; i < sourceAnchors.length; i++) {
		let sourceUUID = toId + sourceAnchors[i];
		let endpoint = instance.addEndpoint(toId, sourceEndpoint[params.signal_type], {
			anchor: sourceAnchors[i],
			uuid: sourceUUID,
			parameters: params,
		});
		endpoint.bind("mouseover", function(ep) {
			ep.addOverlay(["Label", { label: params.signal_type + " out " + params.source_endpoint_idx.toString(), location: [3.2,0.5], visible: true, id: "source_label"} ]);
		});
		endpoint.bind("mouseout", function(ep) {
			ep.removeOverlay("source_label");
		});
		
	}
	for (let j = 0; j < targetAnchors.length; j++) {
		let targetUUID = toId + targetAnchors[j];
		let endpoint = instance.addEndpoint(toId, targetEndpoint[params.signal_type], { 
			anchor: targetAnchors[j],
			uuid: targetUUID,
			parameters: params
		});
		endpoint.addOverlay(["Label", { label: params.signal_type + " in " + params.target_endpoint_idx.toString(), location: [-2,0.5], id: "target_label"} ]);
		endpoint.hideOverlays();
	}
};

let _createBlock = function (blockType) {
	let idx = blockProto[blockType].instances.findIndex(e => { return (e === null || typeof e === "undefined"); });
	if (idx === -1) { idx = blockProto[blockType].instances.length; }
	if (blockProto[blockType].max_instances <= blockProto[blockType].instances.filter(function(value) { return value !== null; }).length) { return; }

	let newBlock = document.createElement("div");
	newBlock.classList = "jtk-node " + blockProto[blockType].class;
	newBlock.id = blockProto[blockType].identifier + "_" + idx;

	let nameDiv = document.createElement("div");
	nameDiv.classList.add("name");
	nameDiv.appendChild(document.createTextNode(blockProto[blockType].description + (blockProto[blockType].max_instances === 1 ? "" : " " + idx)));
	newBlock.appendChild(nameDiv);

	newBlock.appendChild(document.createElement("p"));

	let button = document.createElement("button");
	button.textContent = "Show/hide details";
	button.setAttribute("onclick","_expandBlock('" + newBlock.id + "')");
	newBlock.appendChild(button);

	let parameterSection = document.createElement("div");
	parameterSection.hidden = true;
	parameterSection.classList = "parameter-section";
	for (let p of blockProto[blockType].parameters) {
		let parameter = document.createElement("div");
		let parameterField;
		parameter.classList = "parameter " + p.id;
		parameter.appendChild(document.createTextNode(p.name));
		if (p.type === "select") {
			parameterField = document.createElement("select");
			for (let i = 0; i < p.value.length; i++) {
				let option = document.createElement("option");
				option.value = p.value[i];
				option.appendChild(document.createTextNode((p.hasOwnProperty("text") ? p.text[i] : p.value[i])));
				parameterField.appendChild(option);
			}
			parameterField.style.align = "right";
		} else {
			parameterField = document.createElement("input");
			parameterField.type = p.type;
			parameterField.value = p.value;
			if(p.hasOwnProperty("range")) {
				parameterField.min = p.range[0];
				parameterField.max = p.range[1];
			}
		}

		if (p.oninput === true) {
			parameterField.setAttribute("oninput","_updateEndpoints('" + newBlock.id + "')");
		}

		parameterField.disabled = p.disabled || false;

		parameter.appendChild(parameterField);
		parameterSection.appendChild(parameter);
	}

	if (blockProto[blockType].deletable) {
		let deleteButton = document.createElement("button");
		deleteButton.textContent = "Delete";
		deleteButton.setAttribute("onclick","_deleteBlock('" + newBlock.id + "')");
		parameterSection.appendChild(deleteButton);
	}

	newBlock.appendChild(parameterSection);
	blockProto[blockType].instances[idx] = newBlock.id;
	canvas.appendChild(newBlock);
	_updateEndpoints(newBlock.id);
	instance.draggable(jsPlumb.getSelector(".routing ." + blockProto[blockType].class), { grid: [20, 20] });
	return newBlock;
};

//Add/remove endpoints
let _updateEndpoints = function (blockId) {
	let b = document.getElementById(blockId);
	let blockType = b.id.split("_").slice(0,-1).join("_");
	let newIo = {
		video: {in: 0, out: 0},
		audio: {in: 0, out: 0}
	};
	let overlap = false;
	let crossbarType;
	if (blockType.includes("crossbar")) {
		crossbarType = _readParameter(b, "xbar-type");
		switch (crossbarType) {
		case "a_v":
			overlap = true;
			newIo.video.in = _readParameter(b, "num-in");
			newIo.video.out = _readParameter(b, "num-out");
			newIo.audio.in = _readParameter(b, "num-in");
			newIo.audio.out = _readParameter(b, "num-out");
			break;
		case "video":
			newIo.video.in = _readParameter(b, "num-in");
			newIo.video.out = _readParameter(b, "num-out");
			break;
		case "large":
			newIo.audio.in = _readParameter(b, "num-in");
			newIo.audio.out = _readParameter(b, "num-out");
			break;
		default:
			break;
		}
	} 
	else if (blockType === "sdi") {
		overlap = true;
		let moduleType = _readParameter(b, "io-module-type");
		switch (moduleType) {
		case "2/2/16":
			_disableParameter(b, "num-out", false);
			_disableParameter(b, "num-in", false);
			newIo.video.in = _readParameter(b, "num-out");
			newIo.audio.in = _readParameter(b, "num-out");
			newIo.video.out = _readParameter(b, "num-in");
			newIo.audio.out = _readParameter(b, "num-in");
			break;
		default:
			_disableParameter(b, "num-out", true);
			_disableParameter(b, "num-in", true);
			newIo.video.in = moduleType.split("/")[0];
			newIo.audio.in = moduleType.split("/")[0];
			newIo.video.out = moduleType.split("/")[1];
			newIo.audio.out = moduleType.split("/")[1];
			break;
		}
	}
	else if (blockType === "rtp_receiver") {
		newIo.video.out = _readParameter(b, "num-video");
		newIo.audio.out = _readParameter(b, "num-audio");
	}
	else if (blockType === "video_transmitter") {
		newIo = JSON.parse(JSON.stringify(blockProto[blockType].fixed_endpoints));
		if (_readParameter(b, "format") === "ST2022_6") {
			newIo.audio.in = 1;
		}
	}
	else if (["audio_transmitter", "audio_delay", "video_delay", "audio_src"].includes(blockType)) {
		newIo = JSON.parse(JSON.stringify(blockProto[blockType].fixed_endpoints));
	}

	newIo.audio.in = parseInt(newIo.audio.in);
	newIo.audio.out = parseInt(newIo.audio.out);
	newIo.video.in = parseInt(newIo.video.in);
	newIo.video.out = parseInt(newIo.video.out);

	if (newIo.video.in < 0 || newIo.video.out < 0 || newIo.audio.in < 0 || newIo.audio.out < 0) { return; }
	
	let currentIo = {
		video: {
			in: instance.selectEndpoints({ target: blockId, scope: "video"} ),
			out: instance.selectEndpoints({ source: blockId, scope: "video"} ),
		},
		audio: {
			in: instance.selectEndpoints({ target: blockId, scope: "audio"} ),
			out: instance.selectEndpoints({ source: blockId, scope: "audio"} ),
		}
	};

	instance.batch(function () {
		while (currentIo.video.in.length > newIo.video.in) {
			instance.deleteEndpoint(currentIo.video.in.get(currentIo.video.in.length - 1));
			currentIo.video.in = instance.selectEndpoints({ target: blockId, scope: "video" } );
		}
		while (currentIo.video.out.length > newIo.video.out) {
			instance.deleteEndpoint(currentIo.video.out.get(currentIo.video.out.length - 1));
			currentIo.video.out = instance.selectEndpoints({ source: blockId, scope: "video"  } );
		}
		while (currentIo.audio.in.length > newIo.audio.in) {
			instance.deleteEndpoint(currentIo.audio.in.get(currentIo.audio.in.length - 1));
			currentIo.audio.in = instance.selectEndpoints({ target: blockId, scope: "audio" } );
		}
		while (currentIo.audio.out.length > newIo.audio.out) {
			instance.deleteEndpoint(currentIo.audio.out.get(currentIo.audio.out.length - 1));
			currentIo.audio.out = instance.selectEndpoints({ source: blockId, scope: "audio"  } );
		}
		
		for (let i = 0; i < newIo.video.in; i++) {
			let params = {
				target_type: (blockType === "crossbar" ? crossbarType + "_" : "") +  blockType,
				target_idx: parseInt(blockId.split("_").slice(-1)),
				target_endpoint_idx: i,
				signal_type: "video"
			};
			let anchor = [0,_mapRange(i,[0, ((overlap ? 0 : newIo.audio.in) + newIo.video.in)-1], [0,1]), -1, 0, 0, (overlap ? -8 : 0)];
			if (newIo.video.in + newIo.audio.in === 1 || (newIo.video.in + newIo.audio.in === 2 && overlap)) { anchor[1] = 0.5; }
			if (i >= currentIo.video.in.length) { _addEndpoints(blockId, [], [anchor], params); }
			else { currentIo.video.in.get(i).setAnchor(anchor); }
		}
		for (let i = 0; i < newIo.video.out; i++) {
			let params = {
				source_type: (blockType === "crossbar" ? crossbarType + "_" : "") + blockType,
				source_idx: parseInt(blockId.split("_").slice(-1)),
				source_endpoint_idx: i,
				signal_type: "video"
			};
			let anchor = [1,_mapRange(i, [0, ((overlap ? 0 : newIo.audio.out) + newIo.video.out)-1], [0,1]), 1, 0, 0, (overlap ? -8 : 0)];
			if (newIo.video.out + newIo.audio.out === 1 || (newIo.video.out + newIo.audio.out === 2 && overlap)) { anchor[1] = 0.5; }
			if (i >= currentIo.video.out.length) { _addEndpoints(blockId, [anchor], [], params); }
			else { currentIo.video.out.get(i).setAnchor(anchor); }
		}
		
		for (let i = 0; i < newIo.audio.in; i++) {
			let params = {
				target_type: (blockType === "crossbar" ? crossbarType + "_" : "") + blockType,
				target_idx: parseInt(blockId.split("_").slice(-1)),
				target_endpoint_idx: i,
				signal_type: "audio"
			};
			let anchor = [0,_mapRange((i+(overlap ? 0 : newIo.video.in)), [0, ((overlap ? 0 : newIo.video.in) + newIo.audio.in)-1], [0,1]), -1, 0, 0, (overlap ? 8 : 0)];
			if (newIo.video.in + newIo.audio.in === 1 || (newIo.video.in + newIo.audio.in === 2 && overlap)) { anchor[1] = 0.5; }
			if (i >= currentIo.audio.in.length) { _addEndpoints(blockId, [], [anchor], params); }
			else { currentIo.audio.in.get(i).setAnchor(anchor); }
		}
		for (let i = 0; i < newIo.audio.out; i++) {
			let params = {
				source_type: (blockType === "crossbar" ? crossbarType + "_" : "") + blockType,
				source_idx: parseInt(blockId.split("_").slice(-1)),
				source_endpoint_idx: i,
				signal_type: "audio"
			};
			let anchor = [1,_mapRange((i+(overlap ? 0 : newIo.video.out)), [0, ((overlap ? 0 : newIo.video.out) + newIo.audio.out)-1], [0,1]), 1, 0, 0, (overlap ? 8 : 0)];
			if (newIo.video.out + newIo.audio.out === 1 || (newIo.video.out + newIo.audio.out === 2 && overlap)) { anchor[1] = 0.5; }
			if (i >= currentIo.audio.out.length) { _addEndpoints(blockId, [anchor], [], params); }
			else { currentIo.audio.out.get(i).setAnchor(anchor); }
		}
	});
	currentIo = {
		video: {
			in: instance.selectEndpoints({ target: blockId, scope: "video"} ),
			out: instance.selectEndpoints({ source: blockId, scope: "video"} ),
		},
		audio: {
			in: instance.selectEndpoints({ target: blockId, scope: "audio"} ),
			out: instance.selectEndpoints({ source: blockId, scope: "audio"} ),
		}
	};

	b.style.minHeight = ((Math.max((currentIo.video.out.length + currentIo.audio.out.length), (currentIo.video.in.length + currentIo.audio.in.length))*16) + "px");
	instance.revalidate(document.getElementById(blockId));
};

let _mapRange = function(number, in_range, out_range) {
	return (number - in_range[0]) * ((out_range[1] - out_range[0]) / (in_range[1] - out_range[0])) + out_range[0];
};

let _expandBlock = function (blockId) {
	let p = document.getElementById(blockId).querySelector(".parameter-section");
	if (p.hidden) {
		document.getElementById(blockId).classList.add("expanded"); 
		let n = document.getElementById(blockId).querySelector(".name");
		let inputField = document.createElement("input");
		inputField.type = "text";
		inputField.value = n.textContent;
		n.textContent = "";
		n.appendChild(inputField);
	}
	else { 
		document.getElementById(blockId).classList.remove("expanded"); 
		let n = document.getElementById(blockId).querySelector(".name").getElementsByTagName("input")[0];
		document.getElementById(blockId).querySelector(".name").appendChild(document.createTextNode(n.value));
		n.remove();
	}
	p.hidden = !p.hidden;
	instance.revalidate(document.getElementById(blockId));
};

let _deleteBlock = function(blockId) {
	let b = document.getElementById(blockId);
	let blockType = b.id.split("_").slice(0,-1).join("_");
	blockProto[blockType].instances[blockProto[blockType].instances.indexOf(blockId)] = null;
	instance.removeAllEndpoints(b.id);
	instance.remove(b.id);
	instance.revalidate(b.id);
	b.remove();
};

let _generateJSON = function() {
	let config = {
		system_config: {
		},
	};
	for (let blockType in blockProto) {
		for (let instance of blockProto[blockType].instances) {
			if (instance == null) { continue; }
			let el = document.getElementById(instance);
			if (!el.querySelector(".parameter-section").hidden) {
				_expandBlock(el.id);
			}
			let obj = {};
			obj.name = _readParameter(el, "name");
			if (blockProto[blockType].hasOwnProperty("config_array")) {
				config[blockType+"_config"] = config[blockType+"_config"] || { [blockProto[blockType].config_array] : [] };
			}
			for (let p of blockProto[blockType].parameters) {
				obj[p.id.replace("-","_")] = _readParameter(el, p.id);
			}
			if (el.classList.contains("system")) {
				config.ip = _readParameter(el, "access-ip");
				config.system_config = config.system_config || {};
				config.network_config = config.network_config || {};
				config.system_config.reset = _readParameter(el, "reset");
				config.system_config.fpga = _readParameter(el, "fpga");
				config.network_config.mode = (config.system_config.fpga.endsWith("40GbE") ? "40gbe" : "10gbe");
				if (_readParameter(el, "update-ips")) {
					config.network_config.front_mgmt = _readParameter(el, "front-mgmt");
					config.network_config.rear_mgmt = _readParameter(el, "rear-mgmt");
					config.network_config.addresses = [];
					for (let ip of _readParameter(el, "left-qsfp").split(",")) {
						ip = ip.replace(/\s/g, "");
						config.network_config.addresses.push(ip);
						if (config.network_config.mode === "40gbe") { break; }
					}
					for (let ip of _readParameter(el, "right-qsfp").split(",")) {
						ip = ip.replace(/\s/g, "");
						config.network_config.addresses.push(ip);
						if (config.network_config.mode === "40gbe") { break; }
					}
				}
			}
			else if (el.classList.contains("ptp")) {
				config.ptp_config = config.ptp_config || {};
				for (let p of blockProto[blockType].parameters) {
					config.ptp_config[p.id] = _readParameter(el, p.id);
				}
				if (config.ptp_config.sec_port === "null") { delete config.ptp_config.sec_port; }
			}
			else if (el.classList.contains("sdi")) {
				config.sdi_config = config.sdi_config || { sdi: [] };
				config.sdi_config.io_module_type = _readParameter(el, "io-module-type");
				if (config.sdi_config.io_module_type !== "2/2/16") {
					obj.num_outs = _readParameter(el, "io-module-type").split("/")[1];
				}
				for (let i = 0; i < obj.num_outs; i++) {
					config.sdi_config.sdi.push( { index: i, standard: null, audio: _readParameter(el, "audio")} );
				}
			}
			else if (el.classList.contains("crossbar")) {
				//Add special processing for crossbar parameters here
			}
			else if (el.classList.contains("rtp-receiver")) {
				if (obj.sec_port === "null") { delete obj.sec_port; }
			}
			else if (el.classList.contains("video-transmitter")) {
				if (obj.sec_port === "null") { delete obj.sec_port; }
				if (obj.constr_format === "null") { delete obj.constr_format; }
			}
			else if (el.classList.contains("audio-transmitter")) {
				if (obj.sec_port === "null") { delete obj.sec_port; }
			}
			else if (el.classList.contains("video-delay")) {
				//Add special processing for video delay parameters here
			}
			else if (el.classList.contains("audio-delay")) {
				obj.alloc_time = parseInt(obj.alloc_time*1000000);
				obj.delay_time = parseInt(obj.delay_time*1000000);
			}
			
			if (blockProto[blockType].hasOwnProperty("config_array")) {
				config[blockType+"_config"][blockProto[blockType].config_array].push(obj);
			}
		}
	}

	config.web_routing_config = config.web_routing_config || {};
	config.web_routing_config.routes = _calculateRoutes();

	console.log(config);

	return config;
};

let _calculateRoutes = function() {
	let connectors = instance.select();
	let routes = [];
	for (let i = 0; i < connectors.length; i++) {
		let conn = connectors.get(i).getParameters();
		routes.push(conn);
	}
	return routes;
};

let _setRoutes = function(routes) {
	for (let r of routes) {
		//console.log(JSON.stringify(r));
		let sourceId = r.source_type + "_" + r.source_idx;
		let targetId = r.target_type + "_" + r.target_idx;
		let sourceEndpoint = instance.selectEndpoints({ source: sourceId, scope: r.signal_type}).get(r.source_endpoint_idx);
		let targetEndpoint = instance.selectEndpoints({ target: targetId, scope: r.signal_type}).get(r.target_endpoint_idx);
		if (typeof sourceEndpoint == "undefined" || typeof targetEndpoint == "undefined") { continue; }
		instance.connect({ uuids: [sourceEndpoint.getUuid(), targetEndpoint.getUuid()]});
	}
};

let _configureBlade = function() {
	let obj = _generateJSON();
	let xhr = new XMLHttpRequest();
	let url = "/configure";
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	let data = JSON.stringify(obj);
	xhr.send(data);
};

let _readOutBlade = function() {
	let ip = document.getElementById("readout-ip").value;
	let xhr = new XMLHttpRequest();
	let url = "/readout";
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	let data = JSON.stringify({ip: ip});
	xhr.send(data);
};

let _saveConfiguration = function() {
	let obj = _generateJSON();
	let uriContent = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(obj, null, 2));
	location.href = uriContent;
};

let _loadConfiguration = function() {
	var input = document.createElement("input");
	input.type = "file";
	input.onchange = e => { 
		var file = e.target.files[0]; 
		var reader = new FileReader();
		reader.readAsText(file,"UTF-8");
		reader.onload = readerEvent => {
			var content = readerEvent.target.result; // this is the content!
			console.log( content );
			try {
				_createFromJSON(JSON.parse(content));
			} catch (error) {
				console.log(error);
			}
		};
	};
	input.click();
};

let _readParameter = function(el, param) {
	let val;
	let blockType = el.id.split("_").slice(0,-1).join("_");
	if (param === "name") {
		val = el.querySelector(".name").textContent;
	}
	else {
		let inputType = blockProto[blockType].parameters.find(x => x.id === param).type;
		val = el.querySelector(".parameter." + param.replace("_","-")).getElementsByTagName((inputType == "select" ? "select" : "input"))[0].value;
		if (inputType === "number") { val = parseInt(val); }
	}
	return val;
};

let _setParameter = function(el, param, newValue) {
	let blockType = el.id.split("_").slice(0,-1).join("_");
	param = param.replace("_","-");
	if (param === "name") {
		el.querySelector(".name").textContent = newValue;
	}
	else {
		let inputType = blockProto[blockType].parameters.find(x => x.id === param).type;
		if (inputType === "checkbox") {
			el.querySelector(".parameter." + param).getElementsByTagName("input")[0].checked = newValue;
		} else {
			el.querySelector(".parameter." + param).getElementsByTagName((inputType == "select" ? "select" : "input"))[0].value = newValue;
		}
	}
};

let _disableParameter = function(el, param, disable=true) {
	let blockType = el.id.split("_").slice(0,-1).join("_");
	let inputType = blockProto[blockType].parameters.find(x => x.id === param).type;
	if (inputType === "checkbox") {
		el.querySelector(".parameter." + param.replace("_","-")).getElementsByTagName("input")[0].disabled = disable;
	} else {
		el.querySelector(".parameter." + param.replace("_","-")).getElementsByTagName((inputType == "select" ? "select" : "input"))[0].disabled = disable;
	}
};

let _autoLayout = function() {
	let dg = new dagre.graphlib.Graph();
	dg.setGraph({nodesep:20,ranksep:40,marginx:40,marginy:40, rankdir: "LR"});
	dg.setDefaultEdgeLabel(function() { return {}; });
	for (let blockType in blockProto) {
		if (["system", "ptp"].includes(blockType)) { continue; }
		for (let instance of blockProto[blockType].instances) {
			if (instance == null) { continue; }
			let el = document.getElementById(instance);
			if (!el.querySelector(".parameter-section").hidden) {
				_expandBlock(el.id);
			}
			dg.setNode(el.id, { width: el.clientWidth, height: el.clientHeight} );
		}
	}
	let connectors = instance.select();
	for (let i = 0; i < connectors.length; i++) {
		let conn = connectors.get(i);
		//console.log(conn);
		dg.setEdge(conn.sourceId, conn.targetId);
	}
	dagre.layout(dg);
	dg.nodes().forEach(
		function(n) {
			let node = dg.node(n);
			let top = Math.round(node.y-node.height/2)+"px";
			let left = Math.round(node.x-node.width/2)+"px";
			document.getElementById(n).style.left = left;
			document.getElementById(n).style.top = top;
		});
	instance.repaintEverything();
};

let _createFromJSON = function(obj) {
	instance.batch(function () {
		for (let blockType in blockProto) {
			for (let instance of blockProto[blockType].instances) {
				if (instance !== null) { _deleteBlock(instance); }
			}
		}
		for (let config_obj in obj) {
			if (config_obj == "system_config"){
				let el = _createBlock("system");
				_setParameter(el, "reset", obj.system_config.reset);
				_setParameter(el, "fpga", obj.system_config.fpga);
				if (obj.hasOwnProperty("ip")) { _setParameter(el, "access-ip", obj.ip); }
				if (obj.hasOwnProperty("network_config") && obj.network_config.hasOwnProperty("addresses")) {
					_setParameter(el, "front-mgmt", obj.network_config.front_mgmt);
					_setParameter(el, "rear-mgmt", obj.network_config.rear_mgmt);
					_setParameter(el, "left-qsfp", obj.network_config.addresses.slice(0,(obj.network_config.addresses.length / 2)).join(","));
					_setParameter(el, "right-qsfp", obj.network_config.addresses.slice((obj.network_config.addresses.length / 2)).join(","));
				}
			}
			else if (config_obj == "ptp_config") {
				let el = _createBlock("ptp");
				for (let param in obj.ptp_config) {
					_setParameter(el, param, obj.ptp_config[param]);
				}
			}
			else if (config_obj == "sdi_config") {
				let el = _createBlock("sdi");
				_setParameter(el, "io-module-type", obj.sdi_config.io_module_type);
				if (obj.sdi_config.io_module_type == "2/2/16") {
					_setParameter(el, "num-in", obj.sdi_config.num_in);
					_setParameter(el, "num-out", obj.sdi_config.num_out);
				}
				_updateEndpoints(el.id);
			}
			else if (config_obj == "crossbar_config") {
				for (let crossbarType in obj[config_obj]) {
					crossbarType = crossbarType.slice(0,-1);
					let config_array_name = blockProto[crossbarType].config_array;
					let config_array = obj[config_obj][config_array_name];
					for (let item of config_array) {
						let el = _createBlock(crossbarType);
						for (let param in item) {
							_setParameter(el, param, item[param]);
						}
						_updateEndpoints(el.id);
					}
				}
			}
			else if (["network_config", "ip", "sdi_config", "web_routing_config"].includes(config_obj)){
				// Do nothing
			}
			else {
				let blockType = config_obj.split("_").slice(0,-1).join("_");
				let config_array_name = blockProto[blockType].config_array;
				let config_array = obj[config_obj][config_array_name];
				for (let item of config_array) {
					let el = _createBlock(blockType);
					for (let param in item) {
						_setParameter(el, param, item[param]);
					}
					_updateEndpoints(el.id);
				}
			}
		}

		if (obj.hasOwnProperty("web_routing_config")) { _setRoutes(obj.web_routing_config.routes); }
		_autoLayout();
	});
};

let _zoom = function(direction) {
	let zoom;
	switch (direction) {
	case -1:
		zoom = canvas.style.zoom * 0.9;
		break;
	case 1:
		zoom = canvas.style.zoom * 1.1;
		break;
	case 0:
		zoom = 1;
		break;
	}
	canvas.style.zoom = zoom;
	instance.setZoom(zoom);
	instance.repaintEverything();

};


jsPlumb.ready(function () {
	// suspend drawing and initialise.
	instance.batch(function () {

		let buttonArea = document.getElementById("add-blocks");
		for (let p in blockProto) {
			if (blockProto[p].required) {
				_createBlock(p);
			}
			else {
				let button = document.createElement("button");
				button.textContent = "Create " + blockProto[p].description;
				button.setAttribute("onclick", "_createBlock('" + blockProto[p].identifier + "')");
				buttonArea.appendChild(button);
			}
		}
		for (let b of [{name: "Zoom in", value: "1"}, {name: "Zoom out", value: "-1"}, {name: "Reset zoom", value: "0"}]) {
			let button = document.createElement("button");
			button.style.cssFloat = "right";
			button.textContent = b.name;
			button.setAttribute("onclick", "_zoom(" + b.value + ")");
			buttonArea.appendChild(button);
		}



		instance.bind("connectionDrag", function(conn) {
			instance.selectEndpoints({ target: jsPlumb.getSelector(".jtk-node"), scope: conn.scope}).showOverlays();
		});
		
		instance.bind("connectionDragStop", function(conn) {
			instance.selectEndpoints({ target: jsPlumb.getSelector(".jtk-node"), scope: conn.scope}).hideOverlays();
		});
		
		instance.bind("connectionAborted", function(conn) {
			instance.selectEndpoints({ target: jsPlumb.getSelector(".jtk-node"), scope: conn.scope}).hideOverlays();
		});

	});

});

window.onbeforeunload = function() {
	return "Data will be lost if you leave the page, are you sure?";
};

let blockProto = {
	system: {
		class: "system",
		identifier: "system",
		description: "System",
		instances: [],
		max_instances: 1,
		deletable: false,
		required: true,
		parameters: [
			{id: "access-ip", name: "Configuration IP", type: "text", value: "10.3.143.33"},
			{id: "fpga", name: "FPGA", type: "select", value: ["STREAMING_40GbE", "STREAMING","MULTIVIEWER_40GbE", "MULTIVIEWER"], text: ["Streaming (40GbE)", "Streaming (4x10GbE)","Multiviewer (40GbE)", "Multiviewer (4x10GbE)"]},
			{id: "reset", name: "Reset card before configuration", type: "checkbox", value: false},
			{id: "update-ips", name: "Change IP addresses", type: "checkbox", value: false},
			{id: "front-mgmt", name: "Front management IP", type: "text", value:"10.3.143.33/20"},
			{id: "rear-mgmt", name: "Rear management IP", type: "text", value: "10.3.143.34/20"},
			{id: "left-qsfp", name: "Left QSFP IPs", type: "text", value: "192.168.50.43/16,10.0.0.2/24,10.0.0.3/24,10.0.0.4/24"},
			{id: "right-qsfp", name: "Right QSFP IPs", type: "text", value: "192.168.250.43/16,10.0.1.2/24,10.0.1.3/24,10.0.1.4/24"},
		]
	},
	ptp: {
		class: "ptp",
		identifier: "ptp",
		description: "PTP Setup",
		instances: [],
		max_instances: 1,
		deletable: false,
		required: true,
		parameters: [
			{id: "domain", name: "PTP Domain", type: "number", value: "127", range: [0,127]},
			{id: "port", name: "Primary Agent port", type: "select", value: [0, 1], text: ["Left QSFP", "Right QSFP"]},
			{id: "sec-port", name: "Secondary Agent port", type: "select", value: [null, 0, 1], text: ["None", "Left QSFP", "Right QSFP"]},
			{id: "delay-req", name: "Delay Request mode", type: "select", value: ["Unicast", "Multicast"]},
			{id: "utc", name: "Use UTC offset", type: "select", value: ["Ignore", "Use"]},
		]
	},
	rtp_receiver: {
		class: "rtp-receiver",
		identifier: "rtp_receiver",
		description: "RTP Receiver",
		config_array: "receivers",
		instances: [],
		max_instances: 200,
		deletable: true,
		required: false,
		parameters: [
			{id: "num-video", name: "Video receivers", type: "number", value: 0, oninput: true, range: [0,20]},
			{id: "num-audio", name: "Audio receivers", type: "number", value: 0, oninput: true, range: [0,88]},
			{id: "audio-ch", name: "Audio receiver channels", type: "number", value: 16, oninput: true, range: [0,80]},
			{id: "pri-port", name: "Primary streaming port", type: "select", value: [0, 1], text: ["Left QSFP", "Right QSFP"]},
			{id: "sec-port", name: "Secondary streaming port", type: "select", value: [null, 0, 1], text: ["None", "Left QSFP", "Right QSFP"]},
			{id: "vc2", name: "Supports VC-2", type: "checkbox", value: false},
			{id: "uhd-singlelink", name: "Supports ST2110 singlelink", type: "checkbox", value: false},
			{id: "uhd-2si", name: "Supports 12G 2SI", type: "checkbox", value: false},
			{id: "switch-time", name: "DTS (clean switch)", type: "select", value: [1, 2], text: ["Not enabled", "Automatic timing"]},
			{id: "switch-type", name: "DTS (clean switch) type", type: "select", value: ["BBM", "MBB"], text: ["Break Before Make", "Make Before Break"]},

		]
	},
	a_v_crossbar: {
		class: "av-crossbar",
		identifier: "a_v_crossbar",
		description: "AV Crossbar",
		config_array: "a_v_crossbars",
		instances: [],
		max_instances: 20,
		deletable: true,
		required: false,
		parameters: [
			{id: "num-in", name: "Inputs", type: "number", value: 0, oninput: true, range: [0,200]},
			{id: "num-out", name: "Outputs", type: "number", value: 0, oninput: true, range: [0,200]},
			{id: "xbar-type", name: "Crossbar type", type: "select", value: ["a_v"], text: ["AV"], disabled: true},
			{id: "channels", name: "Audio channels", type: "number", value: 16},
		]
	},
	video_crossbar: {
		class: "video-crossbar",
		identifier: "video_crossbar",
		description: "Video Crossbar",
		config_array: "video_crossbars",
		instances: [],
		max_instances: 20,
		deletable: true,
		required: false,
		parameters: [
			{id: "num-in", name: "Inputs", type: "number", value: 0, oninput: true, range: [0,200]},
			{id: "num-out", name: "Outputs", type: "number", value: 0, oninput: true, range: [0,200]},
			{id: "xbar-type", name: "Crossbar type", type: "select", value: ["video"], text: ["Video"], disabled: true},
		]
	},
	audio_crossbar: {
		class: "audio-crossbar",
		identifier: "audio_crossbar",
		description: "Audio Crossbar",
		config_array: "audio_crossbars",
		instances: [],
		max_instances: 20,
		deletable: true,
		required: false,
		parameters: [
			{id: "num-in", name: "Inputs", type: "number", value: 0, oninput: true, range: [0,200]},
			{id: "num-out", name: "Outputs", type: "number", value: 0, oninput: true, range: [0,200]},
			{id: "xbar-type", name: "Crossbar type", type: "select", value: ["large"], text: ["Audio"], disabled: true},
			{id: "channels", name: "Audio channels", type: "number", value: 16},
		]
	},
	sdi: {
		class: "sdi",
		identifier: "sdi",
		description: "IO Module",
		instances: [],
		max_instances: 1,
		deletable: true,
		required: false,
		parameters: [
			{id: "num-in", name: "SDI Inputs", type: "number", value: 0, disabled: true, oninput: true, range: [2,18]},
			{id: "num-out", name: "SDI Outputs", type: "number", value: 0, disabled: true, oninput: true, range: [2,18]},
			{id: "io-module-type", name: "IO Module type", type: "select", value: ["10/10", "18/2", "2/18", "2/2/16"], text: ["10in/10out", "2in/18out", "18in/2out", "2/2/16 (not supported yet)"], oninput: true},
			{id: "audio", name: "Audio embedding", type: "select", value: ["Embed", "Bypass", "Off"]},
		]
	},
	video_transmitter: {
		class: "video-transmitter",
		identifier: "video_transmitter",
		description: "Video Transmitter",
		config_array: "transmitters",
		instances: [],
		max_instances: 20,
		deletable: true,
		required: false,
		fixed_endpoints: {
			video: { in: 1, out: 0},
			audio: { in: 0, out: 0},
		},
		parameters: [
			{id: "pri-port", name: "Primary streaming port", type: "select", value: [0, 1], text: ["Left QSFP", "Right QSFP"]},
			{id: "pri-mc", name: "Primary Multicast", type: "text", value: "235.0.0.1:9000"},
			{id: "sec-port", name: "Secondary streaming port", type: "select", value: [null, 0, 1], text: ["None", "Left QSFP", "Right QSFP"]},
			{id: "sec-mc", name: "Secondary Multicast", type: "text", value: "235.0.1.1:9000"},
			{id: "format", name: "Streaming format", type: "select", value: ["ST2110_GPM", "ST2022_6", "ST2110_BPM", "ST2042_raw"], oninput: true},
			{id: "constr-format", name: "Constraint (format)", type: "select", 
				value: [null, "PAL", "NTSC", "HD720p25", "HD720p29_97", "HD720p30", "HD720p50", "HD720p59_94", "HD720p60", "HD1080p23_98", "HD1080p24", "HD1080p25", "HD1080p29_97", "HD1080p30", "HD1080i50", "HD1080i59_94", "HD1080i60", "HD1080p50", "HD1080p59_94", "HD1080p60", "HD2160p50", "HD2160p59_94", "HD2160p60", "HD1080p24_DCI", "HD1080i50_DCI"],
				text: ["N/A", "PAL", "NTSC", "HD720p25", "HD720p29_97", "HD720p30", "HD720p50", "HD720p59_94", "HD720p60", "HD1080p23_98", "HD1080p24", "HD1080p25", "HD1080p29_97", "HD1080p30", "HD1080i50", "HD1080i59_94", "HD1080i60", "HD1080p50", "HD1080p59_94", "HD1080p60", "HD2160p50", "HD2160p59_94", "HD2160p60", "HD1080p24_DCI", "HD1080i50_DCI"],
			},
			{id: "constr-bandwidth", name: "Constraint (bandwidth)", type: "select", value: [null, "b1_5Gb", "b3_0Gb", "b12_0Gb"], text: ["N/A", "1.5Gbit/s", "3Gbit/s", "12Gbit/s"]},
			{id: "audio", name: "Audio embedding (2022-6)", type: "select", value: ["Embed", "Bypass", "Off"]},
			{id: "payload", name: "Payload ID", type: "number", value: 97, range: [96,127]},
			{id: "reserve-uhd", name: "Supports ST2110 singlelink", type: "checkbox", value: false},
		]
	},
	audio_transmitter: {
		class: "audio-transmitter",
		identifier: "audio_transmitter",
		description: "Audio Transmitter",
		config_array: "transmitters",
		instances: [],
		max_instances: 100,
		deletable: true,
		required: false,
		fixed_endpoints: {
			video: { in: 0, out: 0},
			audio: { in: 1, out: 0},
		},
		parameters: [
			{id: "pri-port", name: "Primary streaming port", type: "select", value: [0, 1], text: ["Left QSFP", "Right QSFP"]},
			{id: "pri-mc", name: "Primary Multicast", type: "text", value: "236.0.0.1:9000"},
			{id: "sec-port", name: "Secondary streaming port", type: "select", value: [null, 0, 1], text: ["None", "Left QSFP", "Right QSFP"]},
			{id: "sec-mc", name: "Secondary Multicast", type: "text", value: "236.0.1.1:9000"},
			{id: "format", name: "Streaming format", type: "select", value: ["L24", "L16", "AM824"]},
			{id: "packet-time", name: "Packet time", type: "select", 
				value: ["p0_125", "p0_250", "p0_333", "p0_500", "p0_666", "p1"], 
				text: ["0.125ms", "0.250ms", "0.333ms", "0.500ms", "0.666ms", "1.000ms"]
			},
			{id: "num-channels", name: "Audio channels", type: "number", value: 16, range: [1,80]},
			{id: "payload", name: "Payload ID", type: "number", value: 96, range: [96,127]},
		]
	},
	video_delay: {
		class: "video-delay",
		identifier: "video_delay",
		description: "Video Delay",
		config_array: "delays",
		instances: [],
		max_instances: 24,
		deletable: true,
		required: false,
		fixed_endpoints: {
			video: { in: 1, out: 1},
			audio: { in: 0, out: 0},
		},
		parameters: [
			{id: "standard", name: "Video standard", type: "select", 
				value: ["PAL", "NTSC", "HD720p25", "HD720p29_97", "HD720p30", "HD720p50", "HD720p59_94", "HD720p60", "HD1080p23_98", "HD1080p24", "HD1080p25", "HD1080p29_97", "HD1080p30", "HD1080i50", "HD1080i59_94", "HD1080i60", "HD1080p50", "HD1080p59_94", "HD1080p60", "HD2160p50", "HD2160p59_94", "HD2160p60", "HD1080p24_DCI", "HD1080i50_DCI"],
				text: ["PAL", "NTSC", "HD720p25", "HD720p29_97", "HD720p30", "HD720p50", "HD720p59_94", "HD720p60", "HD1080p23_98", "HD1080p24", "HD1080p25", "HD1080p29_97", "HD1080p30", "HD1080i50", "HD1080i59_94", "HD1080i60", "HD1080p50", "HD1080p59_94", "HD1080p60", "HD2160p50", "HD2160p59_94", "HD2160p60", "HD1080p24_DCI", "HD1080i50_DCI"],
			},
			{id: "mode", name: "Mode", type: "select", value: ["FrameSync_Freeze", "FrameSync_Black", "FramePhaser"], text: ["Frame Sync (Freeze)", "FrameSync (Black)", "Frame Phaser"] },
		]
	},
	audio_delay: {
		class: "audio-delay",
		identifier: "audio_delay",
		description: "Audio Delay",
		config_array: "delays",
		instances: [],
		max_instances: 24,
		deletable: true,
		required: false,
		fixed_endpoints: {
			video: { in: 0, out: 0},
			audio: { in: 1, out: 1},
		},
		parameters: [
			{id: "num-channels", name: "Audio channels", type: "number", value: 16, range: [1,80]},
			{id: "frequency", name: "Frequency", type: "select", value: ["F48000", "F96000"], text: ["48KHz", "96Khz"] },
			{id: "alloc-time", name: "Allocated delay time (ms)", type: "number", value: 100, range: [0,10000]},
			{id: "delay-time", name: "Delay time (ms)", type: "number", value: 0, range: [0,10000]},
		]
	},
	audio_src: {
		class: "audio-src",
		identifier: "audio_src",
		description: "Audio SRC",
		config_array: "srcs",
		instances: [],
		max_instances: 24,
		deletable: true,
		required: false,
		fixed_endpoints: {
			video: { in: 0, out: 0},
			audio: { in: 1, out: 1},
		},
		parameters: [
			{id: "channels", name: "SRC Channels", type: "select", 
				value: ["None", "Ch_0_15", "Ch_16_31", "Ch_32_47", "Ch_48_63", "Ch_64_79"], 
				text: ["None", "Ch 1-16", "Ch 17-32", "Ch 33-48", "Ch 49-64", "Ch 65-80"] 
			},
		]
	},
};

let statusMessage = function(statusText) {
	console.log(statusText);
	let status_field = document.getElementById("status-output");
	status_field.textContent = status_field.textContent + "\n" + statusText;
	status_field.scrollTop = status_field.scrollHeight;
}

let connect = function() {
	var ws = new WebSocket('ws://localhost:40510');
	let configButton = document.getElementById("configure-blade");
	let readoutButton = document.getElementById("readout-blade");
	ws.onopen = function() {
		statusMessage("websocket is connected ...");
		configButton.disabled = false;
		readoutButton.disabled = false;
		// sending a send event to websocket server
		ws.send("connected");
	};

	ws.onmessage = function(ev) {
		if (ev.data == "") { return; }
		try {
			console.log(JSON.parse(ev.data));
			_createFromJSON(JSON.parse(ev.data));
		} catch (error) {
			statusMessage(ev.data);
		}
	};

	ws.onclose = function(e) {
		statusMessage('Socket is closed. Reconnect will be attempted in 3 seconds.', e.reason);
		configButton.disabled = true;
		readoutButton.disabled = true;
		setTimeout(function() {
		connect();
		}, 3000);
	};

	ws.onerror = function(err) {
		statusMessage('Socket encountered error: ', err.message, 'Closing socket');
		configButton.disabled = true;
		readoutButton.disabled = true;
		ws.close();
	};
}

connect();
