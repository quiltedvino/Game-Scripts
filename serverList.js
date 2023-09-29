/** @param {NS} ns */
export function scanNode(ns,node, visitedLocations, recursionDepth = 0) {
		if (recursionDepth > 1000) return;

		let edges = ns.scan(node); 
		//ns.tprint(`Currently at ${node}, available connections ${edges}.`);
		let server = ns.getServer(node);
		let maxMoney = server.moneyMax;
		let minHack = server.requiredHackingSkill;
		let baseSec = server.baseDifficulty;
		let tier = server.numOpenPortsRequired;
		let ram = server.maxRam;
		let playerOwned = server.purchasedByPlayer;
		let port = visitedLocations.length;
		let hacked = server.hasAdminRights;


		visitedLocations.push({
			'hostname': node, 'connections': edges, 'maxMoney': maxMoney, 'ram':ram,
			'minHack': minHack, 'baseSec': baseSec, 'tier':tier, 'port': port, 
			'playerOwned':playerOwned, 'hacked':hacked
		});
		let locationsToCheck = visitedLocations.map((x) => x.hostname);

		/*
		ns.tprint(visitedLocations);
		ns.tprint('----')
		ns.tprint(locationsToCheck)
		ns.tprint(`----`)
		*/
		for (let edge of edges) {
			if (locationsToCheck.includes(edge)) {
				//ns.tprint(`We've already been to ${edge}.`)
				continue
			}
			else {
				//ns.tprint(`We haven't checked ${edge} yet -- going there now.`)
				scanNode(ns,edge, visitedLocations, recursionDepth + 1)
			}
		}
	}

export function mapNetwork(ns) {
		let visitedLocations = []
		scanNode(ns,"home", visitedLocations);
		//ns.tprint(visitedLocations.map((x)=>x.hostname));
		return visitedLocations;
	}
/*
	let allNetworks = mapNetwork();

	allNetworks = allNetworks.filter((x)=>x.maxMoney > 1)
				.sort((x,y)=> x.tier - y.tier)
				.map((x)=>`Server: ${x.hostname} has ${x.maxMoney} and is using port ${x.port}. It requires ${x.tier} ports open.`);
	for (let line of allNetworks)
		ns.tprint(line);
*/