// db . Dynamically generates possible exploits as needed and saves them to a database. 
// When relevant exploits are found in the database, bypasses scan for fast use.

if params.len > 3 or params.len == 0 then
	print("db mode(shell|bank|mail|pass) opt-address opt-overwritePasswords")
	exit
end if


// Load Database from file in /home/guest
database = {}


mode = params[0]
exitOnShell = false
checkBanks = false
checkPass = false
checkMail = false
overwritePass = false
newPass = ""

if mode == "shell" then
	exitOnShell = true
else if mode == "bank" then
	checkBanks = true
else if mode == "pass" then
	checkPass = true
else if mode == "mail" then
	checkMail = true
end if



localMode = true

if params.len == 1 then // only mode, no IP or overwritePass option
	print("running local mode with no password overwrite...")
	localMode = true
	overwritePass = false
else if params.len == 2 then // mode + either ip or overwritePass
	if is_valid_ip(params[1]) then
		print("running against ip address " + params[1] + " and not overwriting passwords")
		localMode = false
		overwritePass = false
	else
		print("running local mode and overwriting passwords with pass")
		localMode = true
		newPass = params[1]
		overwritePass = true
	end if
else // mode, IP address, overwitePassword
	print("running against ip address " + params[1] + " and overwriting passwords with pass")
	localMode = false
	newPass = params[2]
	overwritePass = true
end if


metaxploit = include_lib("/lib/metaxploit.so")
if not metaxploit then
    metaxploit = include_lib(current_path + "/metaxploit.so")
end if
if not metaxploit then exit("Error: Can't find metaxploit library in the /lib path or the current folder")
cryptools = include_lib("/lib/crypto.so")
if not cryptools then
		cryptools = include_lib(current_path + "/crypto.so")
	end if
if not cryptools then exit("Error: Can't find crypto.so library in the /lib path or the current folder")

// Needed Functions for main script
UpdateDatabase = function(library)
	print("Updating database with " + library.lib_name + ", version " + library.version)
	toFile = get_shell.host_computer.File("/home/guest/sploitDB").get_content
	
	memoryAddresses = metaxploit.scan(library)
	print(memoryAddresses)
	toFile = toFile + "/" + library.lib_name + "#" + library.version + "\n"
	for address in memoryAddresses
	toFile = toFile + ":" + address + "\n"		
	words = []
	result = metaxploit.scan_address(library,address)
	while result
		begOfWord = result.indexOf("<b>")
		endOfWord = result.indexOf("</b>")
		if endOfWord == null then
			break
		end if
		powerWord = result[begOfWord+3:endOfWord]
		// This could be a powerword, or it could be a library requirement
		//  or version number
		if powerWord[-3:] == ".so" or powerWord[-2] == "." then
			//print("Requires " + powerWord + " library at version ")
			requiredLib = powerWord
		else
			words.push(powerWord)
		end if			
		result = result[endOfWord+3:]	
	end while
	for word in words
		toFile = toFile + word + "\n"
	end for
	end for
	
	get_shell.host_computer.File("/home/guest/sploitDB").set_content(toFile)
	homeServer = get_shell.connect_service("183.128.182.234",22,"root","pass","ssh")
	get_shell.scp("/home/guest/sploitDB","/home/guest",homeServer)
end function


CheckDatabase = function(library)
	database = ReadDatabase()
	sploitsFound = database.hasIndex(library.lib_name + "#" + library.version)
	if sploitsFound == 0 then
		print("<color=red>Database does not contain entry for " + library.lib_name + ", version " + library.version + "</color>")
		UpdateDatabase(library)
		database = ReadDatabase()
		sploitsFound = database.hasIndex(library.lib_name + "#" + library.version)
	end if
	print("<color=green>Found " + database[library.lib_name + "#" + library.version].len + " sploits for " + library.lib_name + ", version " + library.version + "</color>")
	TrySploits(library, database[library.lib_name + "#" + library.version].indexes)
end function

ReadDatabase = function()
	database = {}
	rawContent = get_shell.host_computer.File("/home/guest/sploitDB").get_content
	currentLib = ""
	currentAddress = ""

	//print(rawContent)
	for line in rawContent.split("\\n")
		//print("working on line of length " + line.len)
		if line.len == 0 then
			break
		end if
		if line[0] == "/" then
			//print("adding a library to map")
			currentLib = line[1:]
			//This is a library#version
			database.push(currentLib)
			database[currentLib] = {}
		else if line[0] == ":" then
			//print("adding an address to map")
			currentAddress = line[1:]
			database[currentLib].push(currentAddress)
			database[currentLib][currentAddress] = []
		else
			//print("adding a word to map")
			database[currentLib][currentAddress].push(line)
		end if
	end for
return database
end function

GetPassword = function(userPass)
	if userPass.len != 2 then exit("decipher: " + file.path + " wrong syntax")
	password = cryptools.decipher(userPass[1])
	return password
end function

AccessMailFile = function(homeFolder)
	print("Accesing to Mail.txt files...\nSearching users...")
	print(homeFolder)
	print(homeFolder.name)
	print(homeFolder.parent.name)
	folders = homeFolder.get_folders
	for user in folders
		print("User: " + user.name +" found...")
		subFolders = user.get_folders
		mailFound = false
		for subFolder in subFolders
			if subFolder.name == "Config" then
				files = subFolder.get_files
				for file in files
					if file.name == "Mail.txt" then
						if not file.has_permission("r") then print("failed. Can't access to file contents. Permission denied")
						print("success! Printing file contents...\n" + file.get_content)
						// Decipher in-line
						mailPassLines = file.get_content.split("\n")
						//if mailPassLines.len == 1 then
	
							//userPass = mailPassLines[0].split(":")
							//print(cryptools.decipher(userPass[1]))
						//else
							//print("Multiple users found.")
							for line in mailPassLines
								userPass = line.split(":")
								print(userPass[0] + " -- " + cryptools.decipher(userPass[1]))
							end for
						//end if
						
						mailFound = true
					end if
				end for
			end if
		end for
		if not mailFound then print("Mail file not found.")
	end for
	if folders.len == 0 then print("No users found. Program aborted")
end function



	TrySploits = function(library, sploitList)
		for sploit in sploitList
			print("Attempting sploit against " + library.lib_name + " at address " + sploit)
			database = ReadDatabase()
			for word in database[library.lib_name + "#" + library.version][sploit]
				if overwritePass then
					exploitResult = library.overflow(sploit,word,newPass)
				else
					exploitResult = library.overflow(sploit,word)
				end if	
				print("Tried " + sploit + " on " + library + " with word " + word + " and got " + 
						exploitResult + " ( a " + typeof(exploitResult) + ")")
				if typeof(exploitResult) == "shell" then
					if exitOnShell then
						print("<color=blue>Shell obtained</color>")
						if exploitResult.host_computer.File("/home/guest/sploitDB") == null then
							get_shell.scp("/home/guest/sploitDB","/home/guest",exploitResult)
							get_shell.scp("/home/guest/metaxploit.so","/home/guest",exploitResult)
							get_shell.scp("/home/guest/crypto.so","/home/guest",exploitResult)
							get_shell.scp("/home/guest/db","/home/guest",exploitResult)
							get_shell.scp("/home/guest/nmap","/home/guest",exploitResult)
							if not is_lan_ip(params[1]) then
								get_shell.scp("/home/guest/ScanLan.exe","/home/guest",exploitResult)
							end if
						end if
						exploitResult.start_terminal
						exit
					end if
							
				else if typeof(exploitResult) == "file" then
					if exploitResult.is_folder then
						if checkMail then
							if exploitResult.path == "/home" then
								AccessMailFile(exploitResult)
								continue
							else
								while not exploitResult.path == "/"
									exploitResult = exploitResult.parent
								end while										
								folders = exploitResult.get_folders
								for folder in folders
									if folder.path == "/home" then
										AccessMailFile(folder)
										continue
									end if
								end for
							end if									
						else							
							for file in exploitResult.get_files																			
								if file.name == "passwd" and checkPass then
									if not file then 
									print("<color=red>Error: file /etc/passwd not found</color>")
									continue
									end if
									if not file.has_permission("r") then 
										print("<color=red>Error: can't read /etc/passwd. Permission denied.</color>")
										continue
									end if
									if file.is_binary then 
										print("<color=red>Error: invalid /etc/passwd file found.</color>")
										continue
									end if
									
									listUsers = file.get_content.split("\n")
									for line in listUsers
										userPass = line.split(":")
										print("Deciphering user " + userPass[0] +"...")
										password = GetPassword(userPass)
										if not password then 
											print("Nothing found...")
										else
											print("<color=blue>=> " + password + "</color>")
										end if
									end for
									exit
								end if
							end for
						end if
							end if
				else if typeof(exploitResult) == "number" then
					print("<color=green>Firewall opened or password changed to " + newPass + "</color>")						
				else if typeof(exploitResult) == "computer" then
					canCreateUser = exploitResult.create_user("LegitUser0","pass")
					if canCreateUser == 1 then
						exploitResult.create_user("LegitUser1","pass")
						exploitResult.create_user("LegitUser2","pass")
						exploitResult.create_user("LegitUser3","pass")
						print("<color=blue>Created four new users.</color>")					
					end if
					if checkMail then
						print("checking mail on connected accounts")
						AccessMailFile(exploitResult.File("/home"))
					end if
					
					if checkBanks then
						if newPass != "" then
							print("Looking for bank passwords on this machine.")
							homeFolder = exploitResult.File("/home")
							if not homeFolder then exit("Error: /home folder not found")
							userFolders = homeFolder.get_folders
							found = false
							for userFolder in userFolders
								bankFile = exploitResult.File("/home/" + userFolder.name + "/Config/Bank.txt")
								if not bankFile then continue
								if not bankFile.has_permission("r") then 
									print("Error: can't read file contents. Permission denied")
									continue
								end if
								userPass = bankFile.get_content.split(":")
								print("Deciphering bank password for user: " + userFolder.name)
								password = GetPassword(userPass)
								if not password then 
									print("Nothing found...")
								else
									print("Bank account: " + userPass[0] +"\nBank Password: " + password)
									found = true
								end if
							end for
							if not found then 
								print("No files found")
							else
								exit
							end if			
						else
							file = exploitResult.File("/etc/passwd")
							if not file then exit("Error: file /etc/passwd not found")
							if not file.has_permission("r") then exit("Error: can't read /etc/passwd. Permission denied.")
							if file.is_binary then exit("Error: invalid /etc/passwd file found.")
							listUsers = file.get_content.split("\n")
							for line in listUsers
								userPass = line.split(":")
								print("Deciphering user " + userPass[0] +"...")
								password = GetPassword(userPass)
								if not password then 
									print("Nothing found...")
								else
									print("=> " + password)
								end if
							end for
					end if
					end if
					end if
					
			end for
		end for
	end function

// Get the libraries available to us...
if localMode then
	libFolder = get_shell.host_computer.File("/lib")
	if libFolder.is_folder then
	   files = libFolder.get_files
	   for file in files
			library = metaxploit.load("/lib/"+ file.name)
			print("Checking database for sploits in " + library.lib_name + ", version " + library.version)
			
			CheckDatabase(library)
   		end for
	end if
else // Address provided for remote use. Get remote libraries
	address = params[1]
	if not is_valid_ip(address) then
		print("Error - invalid ip " + address + ". Terminating")
		exit
	end if
	isLanIp = is_lan_ip( address )
	if isLanIp then
	   router = get_router;
	else 
	   router = get_router( address )
	end if
	if router == null then exit("nmap: ip address not found")
	ports = null

	if not isLanIp then
	   ports = router.used_ports
	else
	   ports = router.device_ports(address)
	end if
	for port in ports
		if port.is_closed then
			print("Port " + port.port_number + " is closed, trying anyway.")
		end if
		
		net_session = metaxploit.net_use(address,port.port_number)
		if net_session == null then 
			print("net session failed to return valid library for " + address + " at " + port.port_number)
			continue
		end if
		library = net_session.dump_lib
		CheckDatabase(library)
	end for
		net_session = metaxploit.net_use(address)
		if net_session == null then 
			print("net session failed to return valid library for " + address + " with no port")
		else
			library = net_session.dump_lib
			CheckDatabase(library)
		end if
end if