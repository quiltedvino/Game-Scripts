/** @param {NS} ns */
export async function main(ns) {
	let fileName = ns.args[0];
	let server = ns.args[1];
	let contractData = ns.codingcontract.getData(fileName, server);
	let contractType = ns.codingcontract.getContractType(fileName, server);
	//let contractDesc = ns.codingcontract.getDescription(fileName, server);

	ns.tprint(`Contract Type: ${contractType}`);
	ns.tprint("----");
	ns.tprint(contractData);
	/*
		ns.tprint(`Contract Description: ${contractDesc}`);
		ns.tprint("----");
	*/

	function solve(answer) {
		const reward = ns.codingcontract.attempt(answer, fileName, server);
		if (reward) {
			ns.tprint(`Contract solved successfully! Reward: ${reward}`)
			return true;
		} else ns.tprint("Failed to solve contract.")
		return false;
	}


	switch (contractType) {
		case 'Algorithmic Stock Trader I':
			function stockI(priceArray) {
				let buyPrice, sellPrice, profit, greatestProfit = 0;
				for (let i = 0; i < priceArray.length; i++) {
					buyPrice = priceArray[i];
					for (let j = i + 1; j < priceArray.length; j++) {
						sellPrice = priceArray[j];
						profit = sellPrice - buyPrice;
						if (greatestProfit < profit) {
							greatestProfit = profit;
						}
					}
				}
				return greatestProfit;
			}
			return solve(stockI(contractData));
		case 'Algorithmic Stock Trader II':
			var possibleProfits = []

			function findProfit(remainingDays, profitSoFar = 0, buying = true) {
				if (remainingDays.length == 0) {
					possibleProfits.push(profitSoFar);
					profitSoFar = 0;
					return;
				}

				if (buying) {
					for (let i = -1; i < remainingDays.length; i++) {
						if (i == -1) {
							//try skipping this day.
							findProfit(remainingDays.slice(i + 2, remainingDays.length), profitSoFar, buying);
							continue;
						}
						let prevProfit = profitSoFar
						profitSoFar -= remainingDays[i]; //buy on day i
						//console.log(`Buying at ${remainingDays[i]}. Profit so far ${profitSoFar}`)
						findProfit(remainingDays.slice(i + 1, remainingDays.length), profitSoFar, !buying);
						profitSoFar = prevProfit
					}
				}
				else //selling
				{
					for (let i = -1; i < remainingDays.length; i++) {

						if (i == -1) {
							//try skipping this day.
							findProfit(remainingDays.slice(i + 2, remainingDays.length), profitSoFar, buying);
							continue;
						}
						let prevProfit = profitSoFar
						profitSoFar += remainingDays[i]; //sell on day i
						//console.log(`Selling at ${remainingDays[i]}. Profit so far ${profitSoFar}`)
						findProfit(remainingDays.slice(i + 1, remainingDays.length), profitSoFar, !buying);
						profitSoFar = prevProfit
					}
				}
			}
			findProfit(contractData);
			let maxProfit = possibleProfits.sort((a, b) => b - a)[0];
			return solve(maxProfit);
		case 'Algorithmic Stock Trader III':
			function recursiveProfitFinder(initialDays) {

				for (let i = 0; i < initialDays.length; i++) { // Buying
					//ns.tprint(`Initial Purchase Day Options -- ${remainingDays}`)
					let buyPrice = initialDays[i];
					//create new array of all days after this day.
					let remainingDays = initialDays.slice(i + 1, initialDays.length);
					for (let j = 0; j < remainingDays.length; j++) // Selling
					{
						//ns.tprint(`Initial Sell Day Options -- ${remainingDays}`)
						let sellPrice = remainingDays[j];
						//Find the profit from the difference of buying on the above day and selling on each day
						transactionProfit = sellPrice - buyPrice;
						let remainingDays2 = remainingDays.slice(j + 1, remainingDays.length);
						for (let k = 0; k < remainingDays2.length; k++) // Buying part 2
						{
							//ns.tprint(`Remaining Days after initial transaction; buying from - ${remainingDays}`)
							let buyPrice2 = remainingDays2[k];
							let remainingDays3 = remainingDays2.slice(k + 1, remainingDays2.length);
							for (let l = 0; l < remainingDays3.length; l++) // Selling part 2
							{
								//ns.tprint(`Remaining Days after initial transaction; selling from - ${remainingDays3}`)
								let sellPrice2 = remainingDays3[l];
								secondTransactionProfit = sellPrice2 - buyPrice2;
								if (transactionProfit + secondTransactionProfit > greatestProfit) {

									greatestProfit = transactionProfit + secondTransactionProfit;
									/*
									ns.tprint(`Greatest profit -- buy on day ${i} at ${buyPrice}, sell on day ${j} at ${sellPrice} for ${transactionProfit}`);
									ns.tprint(`Then buy on day ${k} at ${buyPrice2}, sell on day ${l} at ${sellPrice2} for ${secondTransactionProfit}`);
									ns.tprint(`For a total of ${greatestProfit}`);
									*/
								}
							}
						}
					}
				}
				return greatestProfit;
			}
			let transactionProfit = 0, secondTransactionProfit = 0, greatestProfit = 0;
			greatestProfit = recursiveProfitFinder(contractData);
			ns.tprint(`Greatest possible profit with two transactions: ${greatestProfit}`);
			return solve(greatestProfit);

		case 'Array Jumping Game II':
			//ns.tprint("Stole from source code; I don't understand this. :c");
			function solver(_data) {
				const data = _data;
				const n = data.length;
				let reach = 0;
				let jumps = 0;
				let lastJump = -1;
				while (reach < n - 1) {
					let jumpedFrom = -1;
					for (let i = reach; i > lastJump; i--) {
						//ns.tprint(`Reach is ${reach}, jumped from ${jumpedFrom}. `);
						if (i + data[i] > reach) {
							reach = i + data[i];
							jumpedFrom = i;
						}
					}
					if (jumpedFrom === -1) {
						jumps = 0;
						break;
					}
					lastJump = jumpedFrom;
					jumps++;
				}
				return jumps;
			}

			let shortestPath = solver(contractData);
			return solve(shortestPath);

		case 'Compression I: RLE Compression':
			function encoder(rawString) {
				if (rawString.length < 1) {
					return ""; //base case
				}
				//recursive case
				let runCount = 1,
					head,
					tail;

				for (let i = 0; i < rawString.length; i++) {
					if (runCount > 8) {
						break;
					} else if (rawString[i] == rawString[i + 1]) {
						runCount++;
					} else {
						break;
					}
				}

				runCount > 1 ? head = String(runCount) + rawString[0] : head = "1" + rawString[0];
				tail = rawString.substring(runCount);

				return head + encoder(tail);
			}

			let encodedString = encoder(contractData);
			return solve(encodedString);

		case 'Compression II: LZ Decompression':
			function decode(rawString, chunkType1 = true, uncompressedData = "") {

				let head,
					tail;

				if (rawString.length < 1) {
					return uncompressedData; //base case
				}
				else {

					let chunkLength = parseInt(rawString[0]);
					if (chunkLength == 0)
						return decode(rawString.substring(1), !chunkType1, uncompressedData);
					if (chunkType1) {
						head = rawString.substring(1, chunkLength + 1);
						tail = rawString.substring(chunkLength + 1);
					} else {
						let databuffer = parseInt(rawString[1]);
						let uncdatabuff = uncompressedData.substring(uncompressedData.length - databuffer);
						head = "";
						for (let i = 0; i < chunkLength; i++) {
							head = head.concat(uncdatabuff[i % uncdatabuff.length]);
						}
						tail = rawString.substring(2);
					}
					uncompressedData = uncompressedData.concat(head);
					return decode(tail, !chunkType1, uncompressedData);
				}

			}
			let decodedString = decode(contractData);
			return solve(decodedString);
			
		case 'Encryption I: Caesar Cipher':

			function caeserEncrypt(array) {
				let message = array[0]
				let leftShift = array[1]
				let result = ""
				for (let i = 0; i < message.length; i++) {
					let char = message[i];
					if (char == " ") {
						result += ' ';
						continue
					}
					let ch = String.fromCharCode((char.charCodeAt(0) + (-leftShift) + 65) % 26 + 65);
					result += ch;
					//console.log(`Char ${char} becomes ch ${ch}.`);
				}
				return result
			}
			return solve(caeserEncrypt(contractData));
			

		case 'Find Largest Prime Factor':

			function findFactors(num) {
				let factors = []
				for (let i = 1; i < Math.sqrt(num) + 1; i++) {
					if (num % i == 0) {
						factors.push(i);
						if (i != Math.sqrt(num)) {
							factors.push(num / i);
						}

					}
				}
				return factors;
			}

			function largestPrime(factorList) {
				//console.log("Finding largest prime of " + factorList);
				//console.log(`That's  ${factorList.length} numbers to check.`)

				for (let i = 0; i < factorList.length; i++) {
					//console.log(`There are ${findFactors(factorList[i]).length} factors of ${factorList[i]}`)
					if (findFactors(factorList[i]).length <= 2) {
						return factorList[i];
					}
				}
				return null
			}
			let factors = findFactors(contractData).sort((a, b) => b - a);
			let largePrime = largestPrime(factors)
			return solve(largePrime);
			


		case 'Minimum Path Sum in a Triangle':
			var sums = []

			function sumTriangle(contractData, position = 0, depth = 0, maxDepth = null, sumSoFar = 0) {
				if (maxDepth == null) maxDepth = contractData.length - 1;
				let thisCell = contractData[depth][position];
				//console.log(`We're in position ${position} at depth ${depth}. This cell is ${thisCell}.`)
				if (thisCell == undefined)
					return 0
				if (depth == maxDepth) {
					sums.push(sumSoFar + thisCell);
					return
				}
				sumTriangle(contractData, position, depth + 1, maxDepth, sumSoFar + thisCell);
				sumTriangle(contractData, position + 1, depth + 1, maxDepth, sumSoFar + thisCell);
				return
			}
			sumTriangle(contractData);
			return solve(Math.min(...sums));
			

		default:
			ns.tprint(`Contract type ${contractType} not yet defined in script. Aborting.`);
			return false;
	}
}