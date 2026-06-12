let datosTabla = [];

let graficaVictorias;
let graficaPuntos;
let graficaPodios;
let graficaEsperanza;
let graficaRiesgoPerformance;
let graficaComparador;

document.addEventListener('DOMContentLoaded', () => {
    cargarListaTablas();
    cargarDrivers();
    cargarTopDrivers();
    cargarTopConstructors();
    cargarCircuitIntelligence();
    cargarConstructores();
});

function mostrarSeccion(idSeccion){

    const secciones = document.querySelectorAll('.seccion');

    secciones.forEach(seccion => {
        seccion.classList.remove('activa');
    });

    const seccionSeleccionada = document.getElementById(idSeccion);

    if(seccionSeleccionada){
        seccionSeleccionada.classList.add('activa');

        if(idSeccion === 'predictive'){
            actualizarModelosPredictivos();
        }
    }else{
        console.error("No existe la sección:", idSeccion);
    }
}

/* =========================
   TABLAS MYSQL
========================= */

function cargarListaTablas(){

    fetch('/api/tablas')
        .then(response => response.json())
        .then(data => {

            const select = document.getElementById('tablas');

            if(!select){
                return;
            }

            select.innerHTML = '';

            data.forEach(tabla => {

                const nombreTabla =
                    tabla.table_name ||
                    tabla.TABLE_NAME ||
                    tabla.nombre ||
                    Object.values(tabla)[0];

                const option = document.createElement('option');

                option.value = nombreTabla;
                option.textContent = nombreTabla;

                select.appendChild(option);
            });
        })
        .catch(error => {

            console.error('Error loading tables:', error);

            const select = document.getElementById('tablas');

            if(select){
                select.innerHTML = '<option>Error loading tables</option>';
            }
        });
}

function cargarTabla(){

    const tabla = document.getElementById('tablas').value;

    if(!tabla){
        alert('Select a table');
        return;
    }

    fetch(`/api/tabla/${tabla}`)
        .then(response => response.json())
        .then(data => {

            datosTabla = data;
            mostrarTabla(data);

        })
        .catch(error => {

            console.error('Error loading table:', error);

            document.getElementById('tabla-container').innerHTML =
                '<p>Error loading table data</p>';
        });
}

function mostrarTabla(data){

    const contenedor = document.getElementById('tabla-container');

    contenedor.innerHTML = '';

    if(!data || data.length === 0){
        contenedor.innerHTML = '<p>No data found</p>';
        return;
    }

    const tabla = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const columnas = Object.keys(data[0]);

    const filaEncabezado = document.createElement('tr');

    columnas.forEach(columna => {

        const th = document.createElement('th');

        th.textContent = columna;

        filaEncabezado.appendChild(th);
    });

    thead.appendChild(filaEncabezado);

    data.forEach(fila => {

        const tr = document.createElement('tr');

        columnas.forEach(columna => {

            const td = document.createElement('td');

            td.textContent = fila[columna];

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    tabla.appendChild(thead);
    tabla.appendChild(tbody);

    contenedor.appendChild(tabla);
}

const buscador = document.getElementById('buscador');

if(buscador){

    buscador.addEventListener('input', function(){

        const texto = this.value.toLowerCase();

        const datosFiltrados = datosTabla.filter(fila => {

            return Object.values(fila).some(valor =>
                String(valor).toLowerCase().includes(texto)
            );

        });

        mostrarTabla(datosFiltrados);
    });
}

/* =========================
   DRIVERS MYSQL
========================= */

function cargarDrivers(){

    fetch('/api/drivers')
        .then(response => response.json())
        .then(data => {

            console.log('Drivers loaded:', data);

            llenarSelectComparador(data);

            const select = document.getElementById('driverSelect');

            if(!select){
                return;
            }

            select.innerHTML = '';

            if(!data || data.length === 0){

                select.innerHTML = '<option value="">No drivers found</option>';

                return;
            }

            data.forEach(driver => {

                const option = document.createElement('option');

                option.value = driver.driverId;

                option.textContent =
                    driver.driverName ||
                    `${driver.forename || ''} ${driver.surname || ''}`;

                select.appendChild(option);
            });

            actualizarDashboardPiloto();
        })
        .catch(error => {

            console.error('Error loading drivers:', error);

            const select = document.getElementById('driverSelect');

            if(select){
                select.innerHTML = '<option value="">Error loading drivers</option>';
            }
        });
}

function actualizarDashboardPiloto(){

    const select = document.getElementById('driverSelect');

    if(!select || !select.value){
        return;
    }

    const driverId = select.value;
    const driverName = select.options[select.selectedIndex].textContent;

    fetch(`/api/drivers/${driverId}/stats`)
        .then(response => response.json())
        .then(data => {

            console.log('Driver stats:', data);

            if(!data || data.length === 0){

                limpiarPantalla();

                return;
            }

            const driverData = {
                name: driverName,
                seasons: data.map(item => item.season),
                wins: data.map(item => Number(item.wins) || 0),
                podiums: data.map(item => Number(item.podiums) || 0),
                points: data.map(item => Number(item.points) || 0),
                races: data.map(item => Number(item.races) || 0),
                dnfs: data.map(item => Number(item.dnfs) || 0)
            };

            actualizarKPIs(driverData);
            actualizarDriverKPIs(driverData);
            actualizarInsights(driverData);

            destruirGraficas();

            crearGraficaVictorias(driverData);
            crearGraficaPuntos(driverData);
            crearGraficaPodios(driverData);
            crearGraficaEsperanza(driverData);
            crearGraficaRiesgoPerformance(driverData);

            actualizarModelosPredictivos();
        })
        .catch(error => {

            console.error('Error loading driver stats:', error);

            limpiarPantalla();
        });
}

/* =========================
   RANKINGS E INTELLIGENCE
========================= */

function crearTablaHTML(data, columnas){

    if(!data || data.length === 0){
        return '<p>No data available.</p>';
    }

    let html = '<table>';
    html += '<thead><tr>';

    columnas.forEach(col => {
        html += `<th>${col.titulo}</th>`;
    });

    html += '</tr></thead>';
    html += '<tbody>';

    data.forEach(row => {
        html += '<tr>';

        columnas.forEach(col => {
            html += `<td>${row[col.campo] ?? 0}</td>`;
        });

        html += '</tr>';
    });

    html += '</tbody></table>';

    return html;
}

function cargarTopDrivers(){

    fetch('/api/top-drivers')
        .then(response => response.json())
        .then(data => {

            const container = document.getElementById('topDriversContainer');

            if(!container){
                return;
            }

            container.innerHTML = crearTablaHTML(data, [
                { titulo: 'Driver', campo: 'driverName' },
                { titulo: 'Wins', campo: 'wins' },
                { titulo: 'Podiums', campo: 'podiums' },
                { titulo: 'Points', campo: 'points' },
                { titulo: 'Races', campo: 'races' }
            ]);

        })
        .catch(error => {
            console.error('Error loading top drivers:', error);
        });
}

function cargarTopConstructors(){

    fetch('/api/top-constructors')
        .then(response => response.json())
        .then(data => {

            const container = document.getElementById('topConstructorsContainer');

            if(!container){
                return;
            }

            container.innerHTML = crearTablaHTML(data, [
                { titulo: 'Constructor', campo: 'constructorName' },
                { titulo: 'Wins', campo: 'wins' },
                { titulo: 'Podiums', campo: 'podiums' },
                { titulo: 'Points', campo: 'points' },
                { titulo: 'Races', campo: 'races' }
            ]);

        })
        .catch(error => {
            console.error('Error loading top constructors:', error);
        });
}

function cargarCircuitIntelligence(){

    fetch('/api/circuit-intelligence')
        .then(response => response.json())
        .then(data => {

            const container = document.getElementById('circuitIntelligenceContainer');

            if(!container){
                return;
            }

            container.innerHTML = crearTablaHTML(data, [
                { titulo: 'Circuit', campo: 'circuitName' },
                { titulo: 'Country', campo: 'country' },
                { titulo: 'Races', campo: 'totalRaces' },
                { titulo: 'First Year', campo: 'firstYear' },
                { titulo: 'Last Year', campo: 'lastYear' }
            ]);

        })
        .catch(error => {
            console.error('Error loading circuit intelligence:', error);
        });
}

function llenarSelectComparador(data){

    const select1 = document.getElementById('compareDriver1');
    const select2 = document.getElementById('compareDriver2');

    if(!select1 || !select2){
        return;
    }

    select1.innerHTML = '';
    select2.innerHTML = '';

    data.forEach(driver => {

        const nombre =
            driver.driverName ||
            `${driver.forename || ''} ${driver.surname || ''}`;

        const option1 = document.createElement('option');
        option1.value = driver.driverId;
        option1.textContent = nombre;

        const option2 = document.createElement('option');
        option2.value = driver.driverId;
        option2.textContent = nombre;

        select1.appendChild(option1);
        select2.appendChild(option2);
    });

    if(select2.options.length > 1){
        select2.selectedIndex = 1;
    }
}

function compararPilotos(){

    const driver1 = document.getElementById('compareDriver1').value;
    const driver2 = document.getElementById('compareDriver2').value;

    if(!driver1 || !driver2){
        alert('Select two drivers');
        return;
    }

    if(driver1 === driver2){
        alert('Select two different drivers');
        return;
    }

    fetch(`/api/compare-drivers/${driver1}/${driver2}`)
        .then(response => response.json())
        .then(data => {

            const container = document.getElementById('comparisonContainer');

            if(!container){
                return;
            }

            container.innerHTML = crearTablaHTML(data, [
                { titulo: 'Driver', campo: 'driverName' },
                { titulo: 'Wins', campo: 'wins' },
                { titulo: 'Podiums', campo: 'podiums' },
                { titulo: 'Points', campo: 'points' },
                { titulo: 'Races', campo: 'races' },
                { titulo: 'DNF', campo: 'dnfs' }
            ]);

            crearGraficaComparador(data);

        })
        .catch(error => {
            console.error('Error comparing drivers:', error);
        });
}

function crearGraficaComparador(data){

    const canvas = document.getElementById('graficaComparador');

    if(!canvas){
        return;
    }

    if(graficaComparador){
        graficaComparador.destroy();
    }

    const labels = data.map(driver => driver.driverName);

    const wins = data.map(driver => Number(driver.wins) || 0);
    const podiums = data.map(driver => Number(driver.podiums) || 0);
    const points = data.map(driver => Number(driver.points) || 0);
    const races = data.map(driver => Number(driver.races) || 0);
    const dnfs = data.map(driver => Number(driver.dnfs) || 0);

    graficaComparador = new Chart(canvas, {

        type:'bar',

        data:{
            labels:labels,

            datasets:[
                {
                    label:'Wins',
                    data:wins,
                    borderWidth:2,
                    backgroundColor:'rgba(255, 0, 0, 0.70)',
                    borderColor:'rgba(255, 90, 90, 1)'
                },
                {
                    label:'Podiums',
                    data:podiums,
                    borderWidth:2,
                    backgroundColor:'rgba(255, 115, 0, 0.70)',
                    borderColor:'rgba(255, 115, 0, 1)'
                },
                {
                    label:'Points',
                    data:points,
                    borderWidth:2,
                    backgroundColor:'rgba(180, 180, 180, 0.70)',
                    borderColor:'rgba(255, 255, 255, 1)'
                },
                {
                    label:'Races',
                    data:races,
                    borderWidth:2,
                    backgroundColor:'rgba(100, 100, 100, 0.70)',
                    borderColor:'rgba(180, 180, 180, 1)'
                },
                {
                    label:'DNF',
                    data:dnfs,
                    borderWidth:2,
                    backgroundColor:'rgba(120, 0, 0, 0.70)',
                    borderColor:'rgba(255, 0, 0, 1)'
                }
            ]
        },

        options:opcionesConEjes()
    });
}

/* =========================
   KPIS
========================= */

function actualizarKPIs(data){

    const totalWins = sumar(data.wins);
    const totalPoints = sumar(data.points);
    const totalPodiums = sumar(data.podiums);
    const totalRaces = sumar(data.races);

    const averagePoints = totalRaces > 0 ? totalPoints / totalRaces : 0;

    setTexto('kpiWins', totalWins);
    setTexto('kpiPoints', totalPoints.toFixed(1));
    setTexto('kpiPodiums', totalPodiums);
    setTexto('kpiAverage', averagePoints.toFixed(2));
}

function actualizarDriverKPIs(data){

    const totalWins = sumar(data.wins);
    const totalPodiums = sumar(data.podiums);
    const totalRaces = sumar(data.races);
    const totalDnfs = sumar(data.dnfs);

    setTexto('driverWins', totalWins);
    setTexto('driverPodiums', totalPodiums);
    setTexto('driverRaces', totalRaces);
    setTexto('driverDNF', totalDnfs);
}

function actualizarInsights(data){

    const totalWins = sumar(data.wins);
    const totalPodiums = sumar(data.podiums);
    const totalRaces = sumar(data.races);
    const totalPoints = sumar(data.points);
    const totalDnfs = sumar(data.dnfs);

    const winRate = totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0;
    const podiumRate = totalRaces > 0 ? (totalPodiums / totalRaces) * 100 : 0;
    const dnfRate = totalRaces > 0 ? (totalDnfs / totalRaces) * 100 : 0;
    const averagePoints = totalRaces > 0 ? totalPoints / totalRaces : 0;
    const consistency = Math.max(0, 100 - calcularVariabilidad(data.points));

    setTexto(
        'summaryText',
        `${data.name} has participated in ${totalRaces} recorded races, achieving ${totalWins} wins, ${totalPodiums} podiums and ${totalPoints.toFixed(1)} total points.`
    );

    setTexto(
        'competitiveText',
        `The driver shows a win rate of ${winRate.toFixed(2)}% and a podium rate of ${podiumRate.toFixed(2)}%, with an average of ${averagePoints.toFixed(2)} points per race.`
    );

    setTexto(
        'riskText',
        `The recorded DNF rate is ${dnfRate.toFixed(2)}%. This indicator helps evaluate reliability and performance risk across seasons.`
    );

    setTexto(
        'driverWinRate',
        `${winRate.toFixed(2)}% of recorded races ended in victory.`
    );

    setTexto(
        'driverPodiumRate',
        `${podiumRate.toFixed(2)}% of recorded races ended with a podium finish.`
    );

    setTexto(
        'driverConsistency',
        `Consistency Index: ${consistency.toFixed(2)} / 100. Higher values indicate more stable season results.`
    );
}

function limpiarPantalla(){

    limpiarKPIs();
    destruirGraficas();

    setTexto('summaryText', 'No performance data available for this driver.');
    setTexto('competitiveText', 'No competitive profile available.');
    setTexto('riskText', 'No risk profile available.');
    setTexto('driverWinRate', 'No data available.');
    setTexto('driverPodiumRate', 'No data available.');
    setTexto('driverConsistency', 'No data available.');
    setTexto('riskDNF', '0%');
    setTexto('expectedPoints', '0');
    setTexto('podiumProbability', '0%');
    setTexto('riskLevel', 'Low');
}


function limpiarKPIs(){

    const ids = [
        'kpiWins',
        'kpiPoints',
        'kpiPodiums',
        'kpiAverage',
        'driverWins',
        'driverPodiums',
        'driverRaces',
        'driverDNF',
        'riskDNF',
        'expectedPoints',
        'podiumProbability',
        'riskLevel'
    ];

    ids.forEach(id => setTexto(id, 0));
}

function setTexto(id, texto){

    const elemento = document.getElementById(id);

    if(elemento){
        elemento.textContent = texto;
    }
}

/* =========================
   GRÁFICAS
========================= */

function destruirGraficas(){

    if(graficaVictorias){
        graficaVictorias.destroy();
    }

    if(graficaPuntos){
        graficaPuntos.destroy();
    }

    if(graficaPodios){
        graficaPodios.destroy();
    }

    if(graficaEsperanza){
        graficaEsperanza.destroy();
    }

    if(graficaRiesgoPerformance){
        graficaRiesgoPerformance.destroy();
    }
}

function crearGraficaVictorias(data){

    const canvas = document.getElementById('graficaVictorias');

    if(!canvas){
        return;
    }

    graficaVictorias = new Chart(canvas, {

        type:'bar',

        data:{

            labels:data.seasons,

            datasets:[{
                label:`${data.name} - Wins Per Season`,
                data:data.wins,
                borderWidth:2,
                backgroundColor:'rgba(255, 0, 0, 0.70)',
                borderColor:'rgba(255, 90, 90, 1)'
            }]
        },

        options:opcionesConEjes()
    });
}

function crearGraficaPuntos(data){

    const canvas = document.getElementById('graficaPuntos');

    if(!canvas){
        return;
    }

    graficaPuntos = new Chart(canvas, {

        type:'line',

        data:{

            labels:data.seasons,

            datasets:[{
                label:`${data.name} - Points Evolution`,
                data:data.points,
                borderWidth:3,
                tension:.4,
                fill:true,
                backgroundColor:'rgba(255, 115, 0, 0.15)',
                borderColor:'rgba(255, 115, 0, 1)',
                pointBackgroundColor:'white',
                pointBorderColor:'red',
                pointRadius:5
            }]
        },

        options:opcionesConEjes()
    });
}

function crearGraficaPodios(data){

    const canvas = document.getElementById('graficaPodios');

    if(!canvas){
        return;
    }

    const totalWins = sumar(data.wins);
    const totalPodiums = sumar(data.podiums);
    const totalRaces = sumar(data.races);

    const podiumsWithoutWins = Math.max(totalPodiums - totalWins, 0);
    const nonPodiums = Math.max(totalRaces - totalPodiums, 0);

    graficaPodios = new Chart(canvas, {

        type:'doughnut',

        data:{

            labels:[
                'Wins',
                'Podiums Without Win',
                'Non-Podium Races'
            ],

            datasets:[{
                label:`${data.name} - Podium Distribution`,
                data:[
                    totalWins,
                    podiumsWithoutWins,
                    nonPodiums
                ],
                backgroundColor:[
                    'rgba(255, 0, 0, 0.80)',
                    'rgba(255, 115, 0, 0.80)',
                    'rgba(80, 80, 80, 0.80)'
                ],
                borderColor:[
                    'rgba(255, 0, 0, 1)',
                    'rgba(255, 115, 0, 1)',
                    'rgba(160, 160, 160, 1)'
                ],
                borderWidth:2
            }]
        },

        options:opcionesSinEjes()
    });
}

function crearGraficaEsperanza(data){

    const canvas = document.getElementById('graficaEsperanza');

    if(!canvas){
        return;
    }

    const expectedPoints = data.points.map((points, index) => {

        const races = data.races[index];

        if(!races || races === 0){
            return 0;
        }

        return Number((points / races).toFixed(2));
    });

    graficaEsperanza = new Chart(canvas, {

        type:'bar',

        data:{

            labels:data.seasons,

            datasets:[{
                label:`${data.name} - Expected Points Per Race`,
                data:expectedPoints,
                borderWidth:2,
                backgroundColor:'rgba(255, 0, 0, 0.70)',
                borderColor:'rgba(255, 90, 90, 1)'
            }]
        },

        options:opcionesConEjes()
    });
}

function crearGraficaRiesgoPerformance(data){

    const canvas = document.getElementById('graficaRiesgo');

    if(!canvas){
        return;
    }

    const totalRaces = sumar(data.races);
    const totalDnfs = sumar(data.dnfs);
    const totalWins = sumar(data.wins);
    const totalPodiums = sumar(data.podiums);
    const totalPoints = sumar(data.points);

    const dnfRate = totalRaces > 0 ? (totalDnfs / totalRaces) * 100 : 0;
    const nonWinRate = totalRaces > 0 ? ((totalRaces - totalWins) / totalRaces) * 100 : 0;
    const nonPodiumRate = totalRaces > 0 ? ((totalRaces - totalPodiums) / totalRaces) * 100 : 0;
    const averagePoints = totalRaces > 0 ? totalPoints / totalRaces : 0;
    const lowPointsRisk = Math.max(0, 100 - (averagePoints * 8));
    const variabilityRisk = calcularVariabilidad(data.points);

    graficaRiesgo = new Chart(canvas, {

        type:'radar',

        data:{

            labels:[
                'DNF Risk',
                'Non-Win Rate',
                'Non-Podium Rate',
                'Low Points Risk',
                'Performance Volatility'
            ],

            datasets:[{
                label:`${data.name} - Performance Risk Index`,
                data:[
                    dnfRate.toFixed(2),
                    nonWinRate.toFixed(2),
                    nonPodiumRate.toFixed(2),
                    lowPointsRisk.toFixed(2),
                    variabilityRisk.toFixed(2)
                ],
                borderWidth:3,
                backgroundColor:'rgba(255, 0, 0, 0.20)',
                borderColor:'rgba(255, 0, 0, 1)',
                pointBackgroundColor:'white',
                pointBorderColor:'red',
                pointRadius:5
            }]
        },

        options:opcionesRadar()
    });
}

/* =========================
   OPCIONES CHART.JS
========================= */

function opcionesConEjes(){

    return {
        responsive:true,
        maintainAspectRatio:false,

        plugins:{
            legend:{
                labels:{
                    color:'white',
                    font:{
                        size:14
                    }
                }
            }
        },

        scales:{
            x:{
                ticks:{
                    color:'white'
                },
                grid:{
                    color:'rgba(255,255,255,0.08)'
                }
            },
            y:{
                beginAtZero:true,
                ticks:{
                    color:'white'
                },
                grid:{
                    color:'rgba(255,255,255,0.08)'
                }
            }
        }
    };
}

function opcionesSinEjes(){

    return {
        responsive:true,
        maintainAspectRatio:false,

        plugins:{
            legend:{
                labels:{
                    color:'white',
                    font:{
                        size:14
                    }
                }
            }
        }
    };
}

function opcionesRadar(){

    return {
        responsive:true,
        maintainAspectRatio:false,

        plugins:{
            legend:{
                labels:{
                    color:'white',
                    font:{
                        size:14
                    }
                }
            }
        },

        scales:{
            r:{
                beginAtZero:true,
                max:100,

                angleLines:{
                    color:'rgba(255,255,255,0.15)'
                },

                grid:{
                    color:'rgba(255,255,255,0.15)'
                },

                pointLabels:{
                    color:'white',
                    font:{
                        size:13
                    }
                },

                ticks:{
                    color:'white',
                    backdropColor:'transparent'
                }
            }
        }
    };
}

/* =========================
   FUNCIONES AUXILIARES
========================= */

function sumar(arreglo){

    return arreglo.reduce((total, numero) => total + Number(numero || 0), 0);
}

function calcularVariabilidad(arreglo){

    if(!arreglo || arreglo.length === 0){
        return 0;
    }

    const promedio = sumar(arreglo) / arreglo.length;

    const varianza =
        arreglo.reduce((total, numero) => {

            return total + Math.pow(Number(numero || 0) - promedio, 2);

        }, 0) / arreglo.length;

    const desviacion = Math.sqrt(varianza);

    return Math.min(desviacion, 100);
}
function toggleChatbot(){
    const chatbot = document.getElementById("chatbotBox");
    chatbot.classList.toggle("active");
}

function handleChatKey(event){
    if(event.key === "Enter"){
        sendMessage();
    }
}

function sendMessage(){
    const input = document.getElementById("chatInput");
    const messages = document.getElementById("chatMessages");

    const userText = input.value.trim();

    if(userText === ""){
        return;
    }

    messages.innerHTML += `
        <div class="user-message">
            ${userText}
        </div>
    `;

    const botResponse = getBotResponse(userText);

    setTimeout(() => {
        messages.innerHTML += `
            <div class="bot-message">
                ${botResponse}
            </div>
        `;

        messages.scrollTop = messages.scrollHeight;
    }, 400);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;
}

function getBotResponse(text){
    const message = text.toLowerCase();

    if(message.includes("hola") || message.includes("hello") || message.includes("hi")){
        return "Hi! I am your F1 Assistant. I can help you understand the dashboard sections, drivers, constructors, circuits, rankings, comparisons and statistical models.";
    }

    if(message.includes("driver") || message.includes("piloto")){
        return "Driver Analytics shows the selected driver's wins, podiums, total races, DNF count and performance evolution across seasons.";
    }

    if(message.includes("constructor") || message.includes("constructora") || message.includes("team") || message.includes("equipo")){
        return "Constructors Analytics evaluates Formula One teams using wins, podiums, points, reliability, experience and consistency. You can select a constructor and see its radar profile.";
    }

    if(message.includes("circuit") || message.includes("pista")){
        return "Circuit Intelligence analyzes Formula One circuits, including country, number of races, first year and most recent year in the database.";
    }

    if(message.includes("ranking") || message.includes("top")){
        return "The Rankings section displays the top drivers and constructors based on wins, podiums, points and race participation.";
    }

    if(message.includes("compare") || message.includes("comparar") || message.includes("comparador")){
        return "The Driver Comparator allows you to select two drivers and compare their wins, podiums, points, races and DNF records.";
    }

    if(message.includes("database") || message.includes("tabla") || message.includes("mysql")){
        return "The Historical Database section lets you view records directly from MySQL tables and search information inside them.";
    }

    if(message.includes("model") || message.includes("modelo") || message.includes("predict") || message.includes("prediction")){
        return "Statistic Models use historical data to estimate expected points per race and performance risk for the selected driver.";
    }

    if(message.includes("risk") || message.includes("riesgo")){
        return "The risk index evaluates DNF risk, non-win rate, non-podium rate, low points risk and performance volatility.";
    }

    if(message.includes("points") || message.includes("puntos")){
        return "Points help measure scoring capacity. In this dashboard, they are used to evaluate driver and constructor performance over time.";
    }

    if(message.includes("wins") || message.includes("victorias")){
        return "Wins represent the number of races finished in first place. They are one of the strongest indicators of competitive performance.";
    }

    return "I can help you understand this Formula One dashboard. Try asking about drivers, constructors, circuits, rankings, database, comparisons or statistical models.";
}

let graficaConstructores = null;

async function cargarConstructores(){

    const select = document.getElementById('constructorSelect');

    if(!select){
        console.error("No existe constructorSelect");
        return;
    }

    try{
        const res = await fetch('/api/constructors');
        const data = await res.json();

        console.log("Constructors loaded:", data);

        select.innerHTML = '';

        data.forEach(constructor => {
            const option = document.createElement('option');
            option.value = constructor.constructorId;
            option.textContent = constructor.name;
            select.appendChild(option);
        });

        cambiarConstructorRadar();

    }catch(error){
        console.error("Error loading constructors:", error);
        select.innerHTML = '<option>Error loading constructors</option>';
    }
}

async function cambiarConstructorRadar(){

    const select = document.getElementById('constructorSelect');
    const canvas = document.getElementById('graficaConstructores');

    if(!select || !canvas || !select.value){
        return;
    }

    try{
        const constructorId = select.value;

        const res = await fetch(`/api/constructor-profile/${constructorId}`);
        const data = await res.json();

        console.log("Constructor profile:", data);

        const races = Number(data.races) || 1;
        const wins = Number(data.wins) || 0;
        const podiums = Number(data.podiums) || 0;
        const points = Number(data.points) || 0;
        const finished = Number(data.finished) || 0;

        const winRate = (wins / races) * 100;
        const podiumRate = (podiums / races) * 100;
        const pointsIndex = Math.min(points / 100, 100);
        const reliability = (finished / races) * 100;
        const experience = Math.min(races / 10, 100);
        const consistency = (podiumRate + reliability) / 2;

        document.getElementById("constructorRadarTitle").textContent =
            `${data.name} Performance Profile`;

        if(graficaConstructores){
            graficaConstructores.destroy();
        }

        graficaConstructores = new Chart(canvas, {
            type: "radar",
            data: {
                labels: [
                    "Wins",
                    "Podiums",
                    "Points",
                    "Reliability",
                    "Experience",
                    "Consistency"
                ],
                datasets: [{
                    label: data.name,
                    data: [
                        winRate,
                        podiumRate,
                        pointsIndex,
                        reliability,
                        experience,
                        consistency
                    ],
                    backgroundColor: "rgba(0, 180, 216, 0.22)",
                    borderColor: "#00B4D8",
                    pointBackgroundColor: "#90E0EF",
                    pointBorderColor: "#FFFFFF",
                    borderWidth: 3
                }]
            },
            options: opcionesRadar()
        });

    }catch(error){
        console.error("Error loading constructor radar:", error);
    }
}
let graficaRiesgoAbandono = null;
let graficaModeloPredictivo = null;

function actualizarModelosPredictivos(){

    const wins = Number(document.getElementById("driverWins")?.textContent) || 0;
    const podiums = Number(document.getElementById("driverPodiums")?.textContent) || 0;
    const races = Number(document.getElementById("driverRaces")?.textContent) || 1;
    const dnf = Number(document.getElementById("driverDNF")?.textContent) || 0;
    const points = Number(document.getElementById("kpiPoints")?.textContent) || 0;

    const dnfRisk = ((dnf / races) * 100).toFixed(1);
    const expectedPoints = (points / races).toFixed(2);
    const podiumProbability = ((podiums / races) * 100).toFixed(1);

    let riskLevel = "Low";

    if(dnfRisk >= 20){
        riskLevel = "High";
    }else if(dnfRisk >= 10){
        riskLevel = "Medium";
    }

    setTexto('riskDNF', dnfRisk + '%');
    setTexto('expectedPoints', expectedPoints);
    setTexto('podiumProbability', podiumProbability + '%');

    /* NUEVO */
    setTexto(
        'finishRate',
        (100 - Number(dnfRisk)).toFixed(1) + '%'
    );

    setTexto('riskLevel', riskLevel);

    crearGraficaRiesgoAbandono(dnfRisk);
    crearGraficaPredictiva(expectedPoints, podiumProbability, dnfRisk);
}

function crearGraficaRiesgoAbandono(dnfRisk){

    const ctx = document.getElementById("graficaRiesgoAbandono");

    if(!ctx) return;

    if(graficaRiesgoAbandono){
        graficaRiesgoAbandono.destroy();
    }

    graficaRiesgoAbandono = new Chart(ctx, {
        type:"doughnut",
        data:{
            labels:["DNF Risk", "Finish Probability"],
            datasets:[{
                data:[Number(dnfRisk), 100 - Number(dnfRisk)],
                backgroundColor:[
                    "rgba(225,6,0,.85)",
                    "rgba(255,255,255,.18)"
                ],
                borderColor:[
                    "#E10600",
                    "rgba(255,255,255,.3)"
                ],
                borderWidth:2
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            plugins:{
                legend:{
                    labels:{
                        color:"white"
                    }
                }
            }
        }
    });
}

function crearGraficaPredictiva(expectedPoints, podiumProbability, dnfRisk){

    const ctx = document.getElementById("graficaModeloPredictivo");

    if(!ctx) return;

    if(graficaModeloPredictivo){
        graficaModeloPredictivo.destroy();
    }

    const expectedIndex = Math.min(Number(expectedPoints) * 10, 100);
    const podiumIndex = Number(podiumProbability);
    const finishProbability = 100 - Number(dnfRisk);
    const reliabilityIndex = finishProbability;
    const riskControl = 100 - Number(dnfRisk);

    const behaviorIndex =
        (expectedIndex + podiumIndex + finishProbability + reliabilityIndex + riskControl) / 5;

    graficaModeloPredictivo = new Chart(ctx, {
        type:"radar",
        data:{
            labels:[
                "Expected Points",
                "Podium Probability",
                "Finish Probability",
                "Reliability",
                "Risk Control",
                "Behavior Index"
            ],
            datasets:[{
                label:"Performance Behavior Model",
                data:[
                    expectedIndex.toFixed(1),
                    podiumIndex.toFixed(1),
                    finishProbability.toFixed(1),
                    reliabilityIndex.toFixed(1),
                    riskControl.toFixed(1),
                    behaviorIndex.toFixed(1)
                ],
                backgroundColor:"rgba(225,6,0,.22)",
                borderColor:"#E10600",
                pointBackgroundColor:"#FFFFFF",
                pointBorderColor:"#E10600",
                borderWidth:3
            }]
        },
        options:opcionesRadar()
    });
}