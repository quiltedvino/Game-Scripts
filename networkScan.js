function scanNode(ns,node,visitedLocations,recursionDepth = 0)
	{
		if (recursionDepth > 1000) return;
		
		let edges = ns.scan(node); // returns: ["foodnstuff", "sigma-cosmetics", "joesguns", "hong-fang-tea", "harakiri-sushi", "iron-gym"]
		//ns.tprint(`Currently at ${node}, available connections ${edges}.`);
	
		
		visitedLocations.push({'hostname':node,'connections':edges});
		let locationsToCheck = visitedLocations.map((x)=>x.hostname);

		/*
		ns.tprint(visitedLocations);
		ns.tprint('----')
		ns.tprint(locationsToCheck)
		ns.tprint(`----`)
		*/
		for (let edge of edges){
			if (locationsToCheck.includes(edge)){
				//ns.tprint(`We've already been to ${edge}.`)
				continue
			}
			else{
				//ns.tprint(`We haven't checked ${edge} yet -- going there now.`)
				scanNode(ns,edge,visitedLocations,recursionDepth+1)			
			}
		}
		
	}


export function mapNetwork(ns){
		let visitedLocations = []
		scanNode(ns,"home",visitedLocations);
		//ns.tprint(visitedLocations.map((x)=>x.hostname));
		return visitedLocations;
	}