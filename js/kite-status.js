export function getKiteStatus(bin) {
    
    // const url = `https://api.jsonbin.io/v3/b/${bin}`
    // const options = {method: 'GET', headers: {'X-ACCESS-KEY': '$2b$10$/bE7o8ci2IcbK/f8ZjS0n.rjGCIAORv736FEpglq7qcfGJwu5vxIu'}}

    const url = 'https://hilah-ats.github.io/ats-kite-status-json/kite-status.json'

    const status = fetchStatus(url).then(json => {
        
        if (json.ok) { return parseStatus(json.data) }

        return parseError(json.data)     
        
    })
    
    return status
    
}

function fetchStatus(url) {

    let json = 
        fetch(url, {cache: "no-cache"})
            .then((response) => {
                if(!response.ok) {
                    throw new Error('HTTP Bad Status ' + response.status)
                }
                return response.json()
            })
            .then((data) => {
                return {ok: true, data: data}
            })
            .catch((error) => {
                console.log('\x1b[31m%s\x1b[0m', '[kite-status] Fetch Failed')
                console.log('\x1b[31m%s\x1b[0m', '[kite-status] Tried to GET: ' + URL)
                console.error(error)
                return {parsed: false, data: error}
            })
    
    return json
    
}

function parseStatus(status) {

    status.parsed = true
    status.ok = true

    const now = new Date()
    const nowFormatted = now.toLocaleString("en-US", { month: "long", day: "numeric", hour:"numeric", minute: "numeric"})

    //  Create a new Date from startDay (year doesn't matter we just need the month and the day in a date object).
    const start = new Date("2000/"+status.startDay)

    //  Calculate the current school year based on today's date and the start date.
    start.setFullYear(
        (now.getUTCMonth() >= start.getUTCMonth()) && (now.getUTCDate() >= start.getUTCDate()) ? 
            now.getFullYear() : now.getFullYear()-1)
    
    status.alert = {
        "title": `Kite Status Alert: ${nowFormatted}`,
        "apps": [],
        "show": false
    }

    status.applications.forEach((app) => {
        if (app.status > 1) {
            status.alert.show = true
            status.alert.apps.push({
                "name": `${app.name}`,
                "contents":  `${status.states[app.status].name}`,
                "icon": status.states[app.status].icon
            })
        }

        const uptime = getUptime(app.outages, now, start)       

        app.uptime = {
            "schoolYear": start.getFullYear() + " - " + ((start.getFullYear() + 1).toString().substr(-2)),
            "int": (uptime.includes('.') ? uptime.split('.')[0] :uptime+"%"),
            "dec": (uptime.includes('.') ? '.'+uptime.split('.')[1]+'%' : ''),
            "graphOffset": (100 - ((parseInt(uptime)/100) * 100)),
            "display": (app.status > 1) ? "hidden" : ""
        }

        app.message = {
            "date": new Date(app.message.date).toLocaleString("en-US", { month: "long", day: "numeric", hour:"numeric", minute: "numeric"}),
            "contents": (app.message.contents === "" && app.status > 0 ? 
                status.states[app.status].message.replace("{application}", app.name) :
                app.message.contents
            ),
            "display": (app.status === 0) ? "hidden" : ""
        }

        app.status = {
            "state": app.status,
            "name": status.states[app.status].name,
            "icon": status.states[app.status].icon,
            "lastUpdated": nowFormatted
        }
        
        app.error = {
            "display": 'hidden'
        }

    })

    return status

}

function parseError(error) {
    
    return {
        "ok": false,
        "uptime": {
            "display": 'hidden'
        },
        "status": {
            "state": "error",
            "name": 'Unknown',
            "icon": '\uF506',
            "lastUpdated": new Date().toLocaleString("en-US", { month: "long", day: "numeric", hour:"numeric", minute: "numeric"})            
        },
        "message": {
            "contents": '',
        },
        "error": {
            "contents": error
        }        
    }    
    
}

//  Calculate the percentage of time that application has been up.
function getUptime(outages, now, start) {
    
    //  How long the application has been running.
	var runtime = (now - start)/ 3600000
    
    //  Aggregate total outage time.
	var downtime = outages.reduce(function(total, outage){
		return total + outage.downtime
	}, 0)/60
    
    //  How long the application has been down.
	downtime = ((runtime-downtime)/runtime)*100
    
    //  Return percantage of time the appliction has been up (trim to 2 decimal places without rounding).
	return (Math.floor(downtime * 100) / 100).toFixed(2).replace(/[.,]00$/, "")
    
}