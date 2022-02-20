#include "includes\multiplayer_core.inc"

#define public function = def
#define function def

global PlayerTimeConnect	= [MAX_PLAYERS, SE_INT]
global PlayerFirstConnect	= [MAX_PLAYERS, SE_INT]
global PlayerGameTime		= [MAX_PLAYERS, SE_INT]
global PlayerKills			= [MAX_PLAYERS, SE_INT]
global PlayerAdmin			= [MAX_PLAYERS, SE_INT]
global PlayerBannedEnd		= [MAX_PLAYERS, SE_INT]
global PlayerDeaths			= [MAX_PLAYERS, SE_INT]
global PlayerEscape			= [MAX_PLAYERS, SE_INT]

public def OnScriptLoaded()
    if FileType("DataBase/players.ini") == 0 then
        CloseFile(WriteFile("DataBase/players.ini"))
    end
    
    print("Server Manager by senpai#8239 loaded successfully!")
end

public function OnPlayerDropGrenade(pid)
	ServerMessage(GetPlayerNickname(pid) + " threw a grenade.")
end

public def OnIncomingConnection(nickname, ip, steamid)
	//by senpai
	if instr(nickname, "[ADMIN]", 1) then
		return "Delete the prefix [ADMIN] in the nickname"
	end

	//by Ne4to
	local banend = int(GetINIValue("DataBase/players.ini", steamid, "banned", "0"))
	if getunixtime() < banend then return "You banned." + Chr(13) + Chr(10) + "(another "+int((banend-getunixtime())/60)+" min)"
end

public function OnPlayerConnect(pid)
	local steamid = GetPlayerSteamID(pid)
	
	PlayerTimeConnect[pid]	= getunixtime()
	PlayerFirstConnect[pid]	= int(GetINIValue("DataBase/players.ini", steamid, "first_connect", "0"))
	PlayerGameTime[pid]		= int(GetINIValue("DataBase/players.ini", steamid, "game_time", "0"))
	PlayerKills[pid]		= int(GetINIValue("DataBase/players.ini", steamid, "kills", "0"))
	PlayerDeaths[pid]		= int(GetINIValue("DataBase/players.ini", steamid, "deaths", "0"))
	PlayerAdmin[pid]		= int(GetINIValue("DataBase/players.ini", steamid, "admin", "0"))
	PlayerEscape[pid]		= int(GetINIValue("DataBase/players.ini", steamid, "escape", "0"))
	
	RemoveAdmin(pid)
	if PlayerAdmin[pid] == 1 then
		GiveAdmin(pid)
		ChangePlayerTag(pid, "ADMIN", 0, 255, 0)
		SetPlayerMessage(pid, "Once you have admin access, don't fuck around a lot.", 1500)
	end
end

public function OnPlayerDisconnect(pid)
	local steamid = GetPlayerSteamID(pid)
	local unixtime = getunixtime()
	
	PutINIValue("DataBase/players.ini", steamid, "nickname", GetPlayerNickname(pid))
	PutINIValue("DataBase/players.ini", steamid, "admin", PlayerAdmin[pid])
	
	if PlayerFirstConnect[pid] == 0 then
	PutINIValue("DataBase/players.ini", steamid, "first_connect", PlayerTimeConnect[pid])
	end
	
	PutINIValue("DataBase/players.ini", steamid, "last_connect", unixtime)
	
	local time = unixtime - PlayerTimeConnect[pid]
	time = time + PlayerGameTime[pid]
	PutINIValue("DataBase/players.ini", GetPlayerSteamID(pid), "game_time", time)
	
	PutINIValue("DataBase/players.ini", steamid, "kills", PlayerKills[pid])
	PutINIValue("DataBase/players.ini", steamid, "deaths", PlayerDeaths[pid])
	PutINIValue("DataBase/players.ini", steamid, "escape", PlayerEscape[pid])
	
	if PlayerBannedEnd[pid] > unixtime then
		PutINIValue("DataBase/players.ini", steamid, "banned", unixtime + PlayerBannedEnd[pid])
	end
	
	UpdateINIFile("DataBase/players.ini")
end

public function OnPlayerKillPlayer(pid, kid)
	if pid != kid and pid > 0 and pid < MAX_PLAYERS then
	PlayerKills[pid] = PlayerKills[pid] + 1
	end
	
	PlayerDeaths[kid] = PlayerDeaths[kid] + 1
end

public def OnPlayerEscape(pid)
	PlayerEscape[pid] = PlayerEscape[pid] + 1
end

public def OnPlayerChat(pid, msg)
	local id
	
	if instr(msg, "/stats", 1) then
		id = split(msg, 3, " ")
		
		if MAX_PLAYERS > id < 0 then
			SendMessage(pid, "[Stats] Your statistics - kills: " + PlayerKills[pid] + ", deaths: " + PlayerDeaths[pid] + ", escape: " + PlayerEscape[pid])
		else
			if id > 0 and id < MAX_PLAYERS then 
				id = int(id)
				if IsPlayerConnected(id) then
					SendMessage(pid, "[Stats] " + GetPlayerNickname(id) + " - kills: " + PlayerKills[id] + ", deaths: " + PlayerDeaths[id] + ", escape: " + PlayerEscape[id])
				end
			else
				SendMessage(pid, "[Stats] The requested player was not found.")
			end
		end
	end

	if IsPlayerAdmin(pid) then
		// By Ne4to (sample bantime, ini ban)
		if instr(msg, "/ban", 1) then
            id = split(msg, 3, " ")
            local minutes = split(msg, 4, " ")
            if id > 0 and id < MAX_PLAYERS then 
				id = int(id)
				
				if IsPlayerAdmin(id) then
					SendMessage(pid, "[Server] You can't ban the admin, fuck you!")
					return 0
				end
				
                if IsPlayerConnected(id) then
					PlayerBannedEnd[id]		= int(minutes) * 60
					Kick(id, "[Server] Admin " + GetPlayerNickname(pid) + " banned player " + GetPlayerNickname(id))
					
                    return 0
				else
					SendMessage(pid, "[Server] The player is not connected.")
				end
            else
				SendMessage(pid, "[Server] The specified index (" + id + ") does not meet the requirements.")
			end
		end
		
		ServerMessage("[ADMIN] " + GetPlayerNickname(pid) + msg)
		return 0
	end
end

// By Ne4to
def split(s, entry, char)
    while Instr(s,char+char, 1)
        s = Replace(s, char+char,char)
    end
    for n = 1; n < entry; n++
        p = Instr(s, char, 1)
        s = Right(s, Len s-p)
    end
    p = Instr(s, char, 1)
    If p < 1 then
        a = s
    else
        a = Left(s,p-1)
    end
    return a
end