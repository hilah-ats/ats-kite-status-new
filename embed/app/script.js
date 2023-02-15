import { getKiteStatus } from '../../js/kite-status.js'

const params = new URLSearchParams(window.location.search)

getKiteStatus(params.get('bin'))
    .then(status => {
    
        const template = Handlebars.compile(document.getElementById('template').innerHTML)
        
        if (status.parsed) {

            document.body.innerHTML = template(status.applications.find(app => {return app.name === params.get('name')}))    

        } else {

            status.name = params.get('name')
            document.body.innerHTML = template(status)

        }
    
    })