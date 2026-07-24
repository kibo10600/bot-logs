local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local SERVER_URL = "https://bot-logs-xjc7.onrender.com/log-player"

Players.PlayerAdded:Connect(function(player)
	local username = player.Name
	local userId = player.UserId
	
	local accountAgeDays = player.AccountAge
	local years = math.floor(accountAgeDays / 365)
	local days = accountAgeDays % 365
	local accountAgeString = years .. " ans, " .. days .. " jours"

	local data = {
		username = username,
		userId = userId,
		accountAge = accountAgeString
	}
	
	local success, encodedData = pcall(function()
		return HttpService:JSONEncode(data)
	end)
	
	if success then
		task.spawn(function()
			pcall(function()
				HttpService:PostAsync(SERVER_URL, encodedData, Enum.HttpContentType.ApplicationJson)
			end)
		end)
	end
end)
