import * as netscan from "networkScan.js";

/** @param {NS} ns */
export async function main(ns) {
	let targetHost = ns.args[0];
	let networkMap = netscan.mapNetwork(ns);
	let connectionPath = [];
	let attemptedConnections = [];

	//ns.tprint(networkMap);

	function treeSearch(node, connectionPath, attemptedConnections,recursionProtection=0) {
		recursionProtection +=1;
		connectionPath.push(node.hostname);
		attemptedConnections.push(node.hostname);
		//ns.tprint(`Here we are at ${node.hostname}. Current path is ${connectionPath}, we've already been to ${attemptedConnections}.`)
		if (recursionProtection > 100){ ns.tprint(`Recursion overflow~!`); return false;}

		//Base case: we're at the target node
		if (node.hostname == targetHost) {
			return connectionPath;
		}

		if (node.connections.length > 0) {
			//ns.tprint(`This nodes has the following connections to try: ${node.connections}`)
			for (let child of node.connections){
				if(attemptedConnections.includes(child)){
					continue;
				}
				//ns.tprint(`Going to child node ${child} to continue the search.`);
				let searchResult = treeSearch(networkMap.find((x)=>x.hostname == child),connectionPath,attemptedConnections,recursionProtection)
				if (searchResult != false)
				{
					return searchResult;
				}
			}
		}
		connectionPath.pop();
		return false;

	}

	//ns.tprint(networkMap);
	ns.tprint('Running tree algorithm')
	ns.tprint(`Found the following path -- ${treeSearch(networkMap[0],connectionPath,attemptedConnections)} -- to get to ${targetHost}.`);
	ns.tprint(`Connecting...`);

	for (let hop of connectionPath){
		ns.singularity.connect(hop);
	}


}