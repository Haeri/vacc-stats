const COLORS = ["#4caf50", "#7ec47b", "#aad8a6", "#d5ecd2", "#ffffff", "#ffd4c9", "#ffa896", "#ff7a65", "#f44336"];
const COLORS_GREEN = { rgb: [76, 175, 80], hex: "#4caf50" };
const COLORS_RED = { rgb: [244, 67, 54], hex: "#f44336" };
const COLORS_YELLOW = { rgb: [255, 235, 59], hex: "#ffeb3b" };
const COLORS_GRAY = "#71717161";

const START_DATE = Date.parse('2021-01-27');
const START_WEEK = 202104;

const API_URL = "https://www.covid19.admin.ch/api/data/context";

const JSON_PATH = "sources.individual.json.";
const AGE_GROUP_PATH = JSON_PATH + "weekly.byAge.";
const BY_SEX_PATH = JSON_PATH + "weekly.bySex.";
const DAILY_PATH = JSON_PATH + "daily.";

const CASE_AG_PATH = AGE_GROUP_PATH + "casesVaccPersons";
const HOSP_AG_PATH = AGE_GROUP_PATH + "hospVaccPersons";
const DEATH_AG_PATH = AGE_GROUP_PATH + "deathVaccPersons";

const CASE_VACC_PATH = DAILY_PATH + "casesVaccPersons";
const HOSP_VACC_PATH = DAILY_PATH + "hospVaccPersons";
const DEATH_VACC_PATH = DAILY_PATH + "deathVaccPersons";

const CASE_PATH = DAILY_PATH + "cases";
const HOSP_PATH = DAILY_PATH + "hosp";
const DEATH_PATH = DAILY_PATH + "death";

const CASE_WEEKLY_PATH = JSON_PATH + "weekly.default.cases";
const HOSP_WEEKLY_PATH = JSON_PATH + "weekly.default.hosp";
const DEATH_WEEKLY_PATH = JSON_PATH + "weekly.default.death";
const CASE_VACC_SEX_PATH = BY_SEX_PATH + "casesVaccPersons";
const HOSP_VACC_SEX_PATH = BY_SEX_PATH + "hospVaccPersons";
const DEATH_VACC_SEX_PATH = BY_SEX_PATH + "deathVaccPersons";

const VACC_PERSONS_PATH = JSON_PATH + "weeklyVacc.byIndication.fullyVaccPersonsV2";

const vacc_cases_ctx = document.getElementById('vacc_cases').getContext('2d');
const vacc_hosps_ctx = document.getElementById('vacc_hosps').getContext('2d');
const vacc_deaths_ctx = document.getElementById('vacc_deaths').getContext('2d');
const vacc_cases_ag_ctx = document.getElementById('vacc_cases_ag').getContext('2d');
const vacc_hosps_ag_ctx = document.getElementById('vacc_hosps_ag').getContext('2d');
const vacc_deaths_ag_ctx = document.getElementById('vacc_deaths_ag').getContext('2d');

const case_efficacy_pie_ctx = document.getElementById('case_pie').getContext('2d');
const hosp_efficacy_pie_ctx = document.getElementById('hosp_pie').getContext('2d');
const death_efficacy_pie_ctx = document.getElementById('death_pie').getContext('2d');
const efficacy_timeline_ctx = document.getElementById('efficacy_timeline').getContext('2d');

const range_track_ui = document.getElementsByClassName("range-input-track")[0];
const range_ui = document.getElementsByClassName("range-input-range")[0];
const thumb_left_ui = document.getElementsByClassName("range-input-thumb-left")[0];
const thubb_right_ui = document.getElementsByClassName("range-input-thumb-right")[0];
const min_input_ui = document.getElementById("min-input");
const max_input_ui = document.getElementById("max-input");
const min_value_ui = document.getElementById("value-min");
const max_value_ui = document.getElementById("value-max");

const total_cases_sum_ui = document.getElementById('total_cases_sum');
const vacc_cases_sum_ui = document.getElementById('vacc_cases_sum');
const case_efficacy_ui = document.getElementById("case_efficacy");
const total_hosps_sum_ui = document.getElementById('total_hosps_sum');
const vacc_hosps_sum_ui = document.getElementById('vacc_hosps_sum');
const hosp_efficacy_ui = document.getElementById("hosp_efficacy");
const total_deaths_sum_ui = document.getElementById('total_deaths_sum');
const vacc_deaths_sum_ui = document.getElementById('vacc_deaths_sum');
const death_efficacy_ui = document.getElementById("death_efficacy");


var dataset_vacc_persons = [];
var dataset_vacc_cases_ag = [];
var dataset_vacc_hosps_ag = [];
var dataset_vacc_deaths_ag = [];
var dataset_vacc_cases_weekly = [];
var dataset_vacc_hosps_weekly = [];
var dataset_vacc_deaths_weekly = [];
var dataset_cases_weekly = [];
var dataset_hosps_weekly = [];
var dataset_deaths_weekly = [];
var dataset_efficacy_cases = [];
var dataset_efficacy_hosps = [];
var dataset_efficacy_deaths = [];
var dates = [];

var case_efficacy_pie_chart;
var hosp_efficacy_pie_chart;
var death_efficacy_pie_chart;
var efficacy_chart;
var cases_chart;
var hosps_chart;
var deaths_chart;
var cases_ag_chart;
var hosps_ag_chart;
var deaths_ag_chart;

var completion = {
    case: {
        vacc: false,
        total: false
    },
    hosp: {
        vacc: false,
        total: false
    },
    death: {
        vacc: false,
        total: false
    }
}

// ---------------- GENERAL FUNCTIONS ---------------- //

function recLookup(obj, path) {
    parts = path.split(".");
    if (parts.length == 1) {
        return obj[parts[0]];
    }
    return recLookup(obj[parts[0]], parts.slice(1).join("."));
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function group_by(xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

function group_by_sum(array, match_key, sum_key) {
    var result = [];
    array.reduce((res, value) => {
        if (!res[value[match_key]]) {
            res[value[match_key]] = { [match_key]: value[match_key], [sum_key]: 0 };
            result.push(res[value[match_key]])
        }
        res[value[match_key]][sum_key] += value[sum_key];
        return res;
    }, {});
    return result;
}


function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

function value2Color(val, max_val, min_c, max_c) {
    let t = val / max_val;
    let r = Math.floor(lerp(min_c[0], max_c[0], t));
    let g = Math.floor(lerp(min_c[1], max_c[1], t));
    let b = Math.floor(lerp(min_c[2], max_c[2], t));
    return rgbToHex(r, g, b);
}





function buildChart(ctx, data, label) {
    var case_max = Math.max(...data.map(el => el.entries));
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(el => el.date),
            datasets: [{
                label: label,
                data: data.map(el => el.entries),
                backgroundColor: data.map(el => value2Color(el.entries, case_max, COLORS_GREEN.rgb, COLORS_RED.rgb))
            }],
        },
        options: {
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    beginAtZero: true,
                }
            }
        }
    });
    return myChart;
}
function buildChartAg(ctx, data, label) {
    let grouped_data = group_by(data, "altersklasse_covid19");
    let dataset = [];

    Object.entries(grouped_data).forEach(([key, value], index) => {
        if (key == 'Unbekannt') return;
        dataset.push({
            label: value[0].altersklasse_covid19,
            data: value.map(el => el.entries),
            backgroundColor: COLORS[index]
        });
    });

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(group_by(data, "date")).map(el => parseInt(el)),
            datasets: dataset
        },
        options: {
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    beginAtZero: true,
                    stacked: true
                }
            }
        }
    });

    return myChart;
}

function buildPie(ctx, data) {
    let color = value2Color(data[0], data[0] + data[1], COLORS_GREEN.rgb, COLORS_RED.rgb);
    var myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: data,
                backgroundColor: [COLORS_GRAY, color],
                borderWidth: 0,
                cutout: "95%"
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            }
        }
    });

    return myChart;
}




// ---------------- TIMELINE ---------------- //

function build_timeline_chart() {
    efficacy_chart = new Chart(efficacy_timeline_ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: "Efficacy Cases",
                data: [],
                backgroundColor: COLORS_GREEN.hex,
                borderColor: COLORS_GREEN.hex,
            },
            {
                label: "Efficacy Hospitalizations",
                data: [],
                backgroundColor: COLORS_YELLOW.hex,
                borderColor: COLORS_YELLOW.hex,
            },
            {
                label: "Efficacy Deaths",
                data: [],
                backgroundColor: COLORS_RED.hex,
                borderColor: COLORS_RED.hex,
                hidden: true
            }]
        },
        options: {
            scales: {
                y: {
                    suggestedMin: 70,
                }
            }
        }
    });
}
function set_timeline_chart_data(index, data) {
    efficacy_chart.data.datasets[index].data = data.map(el => el.efficacy);
    efficacy_chart.data.labels = data.map(el => el.date);
    efficacy_chart.update();
}
function update_timeline_chart_range(week_min, week_max) {
    efficacy_chart.options.scales.x = {
        min: week_min,
        max: week_max
    };
    efficacy_chart.update();
}


function build_efficacy_chart(ctx) {
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [],
                backgroundColor: [COLORS_GRAY, COLORS_GREEN],
                borderWidth: 0,
                cutout: "95%"
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            }
        }
    });

    return chart;
}
function set_efficacy_chart_data(chart, percent) {
    chart.data.datasets[0].data = [100 - percent, percent];
    chart.data.datasets[0].backgroundColor[1] = value2Color(percent, 100, COLORS_RED.rgb, COLORS_GREEN.rgb);
    chart.update();
}






function updateSummary(chart, dataset_efficacy, min_week, max_week, total_sum_ui, vacc_sum_ui, efficacy_ui) {
    let { vacc, unvacc, efficacy } = calculate_efficacy_average(dataset_efficacy, min_week, max_week);

    total_sum_ui.innerText = numberWithCommas(unvacc + vacc);
    vacc_sum_ui.innerText = numberWithCommas(vacc);

    efficacy_ui.innerText = parseFloat(efficacy.toFixed(1)) + "%";
    let eff_int = parseInt(efficacy);
    set_efficacy_chart_data(chart, eff_int);
}


function buildEfficacy(chart, vacc_weekly, total_weekly, total_sum_ui, vacc_sum_ui, efficacy_ui, index) {
    if (total_weekly.length && vacc_weekly.length) {
        let dataset_efficacy = generate_efficacy_dataset(vacc_weekly, total_weekly, START_WEEK, dates.weeks[dates.weeks.length - 1]);

        updateSummary(chart, dataset_efficacy, START_WEEK, dates.weeks[dates.weeks.length - 1], total_sum_ui, vacc_sum_ui, efficacy_ui);

        set_timeline_chart_data(index, dataset_efficacy);

        if (dataset_efficacy == dataset_cases_weekly) {
            setTimeout(() => {
                var favicon = document.getElementById('favicon');
                var canvas = document.getElementById('case_pie');
                favicon.href = canvas.toDataURL('image/png');
            }, 1000);
        }

        return dataset_efficacy;
    }
}

function get_iso_week(date) {
    var d = new Date(date);
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return parseInt(d.getFullYear() + String(Math.ceil((((d - yearStart) / 86400000) + 1) / 7)).padStart(2, '0'));
}

function update_summary_widget() {

}

function update_range() {
    let new_min = parseInt(min_input_ui.value);
    let new_max = parseInt(max_input_ui.value);
    cases_chart.options.scales.x = {
        min: new_min,
        max: new_max,
        stacked: true,
    };
    cases_chart.update();

    hosps_chart.options.scales.x = {
        min: new_min,
        max: new_max,
        stacked: true,
    };
    hosps_chart.update();

    deaths_chart.options.scales.x = {
        min: new_min,
        max: new_max,
        stacked: true,
    };
    deaths_chart.update();


    let week_min = dates.weeks[new_min];
    let week_max = dates.weeks[new_max];

    update_timeline_chart_range(week_min, week_max);

    cases_ag_chart.options.scales.x = {
        min: week_min,
        max: week_max,
        stacked: true,
    };
    cases_ag_chart.update();

    hosps_ag_chart.options.scales.x = {
        min: week_min,
        max: week_max,
        stacked: true,
    };
    hosps_ag_chart.update();

    deaths_ag_chart.options.scales.x = {
        min: week_min,
        max: week_max,
        stacked: true,
    };
    deaths_ag_chart.update();



    updateSummary(case_efficacy_pie_chart, dataset_efficacy_cases, week_min, week_max, total_cases_sum_ui, vacc_cases_sum_ui, case_efficacy_ui);
    updateSummary(hosp_efficacy_pie_chart, dataset_efficacy_hosps, week_min, week_max, total_hosps_sum_ui, vacc_hosps_sum_ui, hosp_efficacy_ui);
    updateSummary(death_efficacy_pie_chart, dataset_efficacy_deaths, week_min, week_max, total_deaths_sum_ui, vacc_deaths_sum_ui, death_efficacy_ui);
}


function generate_efficacy_dataset(vacc_data, tot_data, week_min, week_max) {
    vacc_data = vacc_data.filter(el => (el.date >= week_min && el.date <= week_max));
    tot_data = tot_data.filter(el => (el.date >= week_min && el.date <= week_max));
    let vacc_stats = dataset_vacc_persons.filter(el => (el.date >= week_min && el.date <= week_max));

    let ret = [];
    vacc_data.forEach((el, i) => {
        if (vacc_stats[i].date != tot_data[i].date || vacc_stats[i].date != vacc_stats[i].date) console.log("PROBLEM:", i);
        let vacc_persons = vacc_stats[i].sumTotal;
        let unvacc_persons = tot_data[i].pop - vacc_stats[i].sumTotal;
        let vacc_cases = el.entries;
        let unvacc_cases = tot_data[i].entries - el.entries;
        let RR = (vacc_cases / vacc_persons * 100) / (unvacc_cases / unvacc_persons * 100);
        let VE = Math.max((1 - RR) * 100, 0);
        ret.push({
            date: el.date,
            vacc_cases,
            vacc_persons,
            unvacc_cases,
            unvacc_persons,
            efficacy: VE
        })
    })
    return ret;
}

function calculate_efficacy_average(dataset, week_min, week_max) {
    dataset = dataset.filter(el => (el.date >= week_min && el.date <= week_max));
    let weight = 1 / dataset.length;
    return {
        vacc: dataset.reduce((acc, el) => acc + el.vacc_cases, 0),
        unvacc: dataset.reduce((acc, el) => acc + el.unvacc_cases, 0),
        efficacy: dataset.reduce((acc, el) => acc + el.efficacy * weight, 0)
    }
}


fetch(API_URL)
    .then(res => res.json())
    .then(out => {

        let date_source_ui = document.getElementById('date-source');
        date_source_ui.innerText = new Date(out.sourceDate).toLocaleDateString("de-CH").replaceAll("/", ".");

        fetch(recLookup(out, VACC_PERSONS_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_vacc_persons = out.filter(el => el.geoRegion === "all" && el.indication === "all");
            })
            .catch(err => { console.log(err) });


        fetch(recLookup(out, CASE_VACC_PATH))
            .then(res => res.json())
            .then(out => {
                cases_chart = buildChart(vacc_cases_ctx, out, 'Vully Vaccinated');


                let range_max_date_ui = document.getElementById('range-max-date');
                range_max_date_ui.innerText = new Date(out[out.length - 1].date).toLocaleDateString("de-CH").replaceAll("/", ".");

                dates = {
                    us: out.map(el => new Date(el.date).toLocaleDateString()),
                    ch: out.map(el => new Date(el.date).toLocaleDateString("de-CH").replaceAll("/", ".")),
                    weeks: out.map(el => get_iso_week(new Date(el.date).toLocaleDateString())),
                }
                min_input_ui.max = dates.us.length - 1;
                max_input_ui.max = dates.us.length - 1;
                max_input_ui.value = dates.us.length - 1;
                min_value_ui.innerHTML = dates.ch[min_input_ui.value];
                max_value_ui.innerHTML = dates.ch[max_input_ui.value];

                dates.weeks.forEach((el, i) => {
                    let elem = document.createElement("span");
                    if (dates.weeks[i - 1] !== el) {
                        elem.className = "mark";
                    }
                    range_track_ui.appendChild(elem);
                });
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, CASE_PATH))
            .then(res => res.json())
            .then(out => {
                let data = out.filter(el => START_DATE <= Date.parse(el.datum));
                data = {
                    label: 'Total',
                    data: data.map(el => el.entries),
                    backgroundColor: COLORS_GRAY,
                    hidden: true
                }

                cases_chart.data.datasets.push(data);
                cases_chart.update();
            })
            .catch(err => { console.log(err) });


        fetch(recLookup(out, HOSP_VACC_PATH))
            .then(res => res.json())
            .then(out => {
                hosps_chart = buildChart(vacc_hosps_ctx, out, 'Vully Vaccinated');
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, HOSP_PATH))
            .then(res => res.json())
            .then(out => {
                let data = out.filter(el => START_DATE <= Date.parse(el.datum));
                data = {
                    label: 'Total',
                    data: data.map(el => el.entries),
                    backgroundColor: COLORS_GRAY,
                    hidden: true
                }

                hosps_chart.data.datasets.push(data);
                hosps_chart.update();
            })
            .catch(err => { console.log(err) });



        fetch(recLookup(out, DEATH_VACC_PATH))
            .then(res => res.json())
            .then(out => {
                deaths_chart = buildChart(vacc_deaths_ctx, out, 'Vully Vaccinated');
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, DEATH_PATH))
            .then(res => res.json())
            .then(out => {
                let data = out.filter(el => START_DATE <= Date.parse(el.datum));
                data = {
                    label: 'Total',
                    data: data.map(el => el.entries),
                    backgroundColor: COLORS_GRAY,
                    hidden: true
                }

                deaths_chart.data.datasets.push(data);
                deaths_chart.update();
            })
            .catch(err => { console.log(err) });


        fetch(recLookup(out, CASE_AG_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_vacc_cases_ag = out;
                cases_ag_chart = buildChartAg(vacc_cases_ag_ctx, out, 'cases per week in age groups');
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, HOSP_AG_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_hosps_cases_ag = out;
                hosps_ag_chart = buildChartAg(vacc_hosps_ag_ctx, out, 'hospitalizations per week in age groups');
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, DEATH_AG_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_deaths_cases_ag = out;
                deaths_ag_chart = buildChartAg(vacc_deaths_ag_ctx, out, 'deaths per week in age groups');
            })
            .catch(err => { console.log(err) });





        fetch(recLookup(out, CASE_WEEKLY_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_cases_weekly = out.filter(el => el.geoRegion === "CHFL");
                dataset_cases_weekly = dataset_cases_weekly.map(el => ({
                    date: el.datum,
                    entries: el.entries,
                    pop: el.pop
                }));

                dataset_efficacy_cases = buildEfficacy(case_efficacy_pie_chart, dataset_vacc_cases_weekly, dataset_cases_weekly, total_cases_sum_ui, vacc_cases_sum_ui, case_efficacy_ui, 0);
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, HOSP_WEEKLY_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_hosps_weekly = out.filter(el => el.geoRegion === "CHFL");
                dataset_hosps_weekly = dataset_hosps_weekly.map(el => ({
                    date: el.datum,
                    entries: el.entries,
                    pop: el.pop
                }));

                dataset_efficacy_hosps = buildEfficacy(hosp_efficacy_pie_chart, dataset_vacc_hosps_weekly, dataset_hosps_weekly, total_hosps_sum_ui, vacc_hosps_sum_ui, hosp_efficacy_ui, 1);
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, DEATH_WEEKLY_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_deaths_weekly = out.filter(el => el.geoRegion === "CHFL");
                dataset_deaths_weekly = dataset_deaths_weekly.map(el => ({
                    date: el.datum,
                    entries: el.entries,
                    pop: el.pop
                }));
                dataset_efficacy_deaths = buildEfficacy(death_efficacy_pie_chart, dataset_vacc_deaths_weekly, dataset_deaths_weekly, total_deaths_sum_ui, vacc_deaths_sum_ui, death_efficacy_ui, 2);
            })
            .catch(err => { console.log(err) });

        fetch(recLookup(out, CASE_VACC_SEX_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_vacc_cases_weekly = out.filter(el => el.sex === "all");
                dataset_vacc_cases_weekly = dataset_vacc_cases_weekly.map(el => ({
                    date: el.date,
                    entries: el.entries
                }));

                dataset_efficacy_cases = buildEfficacy(case_efficacy_pie_chart, dataset_vacc_cases_weekly, dataset_cases_weekly, total_cases_sum_ui, vacc_cases_sum_ui, case_efficacy_ui, 0);
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, HOSP_VACC_SEX_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_vacc_hosps_weekly = out.filter(el => el.sex === "all");
                dataset_vacc_hosps_weekly = dataset_vacc_hosps_weekly.map(el => ({
                    date: el.date,
                    entries: el.entries
                }));

                dataset_efficacy_hosps = buildEfficacy(hosp_efficacy_pie_chart, dataset_vacc_hosps_weekly, dataset_hosps_weekly, total_hosps_sum_ui, vacc_hosps_sum_ui, hosp_efficacy_ui, 1);
            })
            .catch(err => { console.log(err) });
        fetch(recLookup(out, DEATH_VACC_SEX_PATH))
            .then(res => res.json())
            .then(out => {
                dataset_vacc_deaths_weekly = out.filter(el => el.sex === "all");
                dataset_vacc_deaths_weekly = dataset_vacc_deaths_weekly.map(el => ({
                    date: el.date,
                    entries: el.entries
                }));

                dataset_efficacy_deaths = buildEfficacy(death_efficacy_pie_chart, dataset_vacc_deaths_weekly, dataset_deaths_weekly, total_deaths_sum_ui, vacc_deaths_sum_ui, death_efficacy_ui, 2);
            })
            .catch(err => { console.log(err) });



    })
    .catch(err => { console.log(err) });



document.addEventListener('DOMContentLoaded', () => {


    case_efficacy_pie_chart = build_efficacy_chart(case_efficacy_pie_ctx);
    hosp_efficacy_pie_chart = build_efficacy_chart(hosp_efficacy_pie_ctx);
    death_efficacy_pie_chart = build_efficacy_chart(death_efficacy_pie_ctx);

    build_timeline_chart();

    document.getElementById("min-input").addEventListener("input", (e) => {
        min_input_ui.value = Math.min(min_input_ui.value, max_input_ui.value);
        let value = (min_input_ui.value / parseInt(min_input_ui.max)) * 100;
        range_ui.style.left = value + '%';
        thumb_left_ui.style.left = value + '%';
        min_value_ui.innerHTML = dates.ch[min_input_ui.value];
    });

    document.getElementById("max-input").addEventListener("input", (e) => {
        max_input_ui.value = Math.max(max_input_ui.value, min_input_ui.value);
        let value = (max_input_ui.value / parseInt(max_input_ui.max)) * 100;
        range_ui.style.right = (100 - value) + '%';
        thubb_right_ui.style.left = value + '%';
        max_value_ui.innerHTML = dates.ch[max_input_ui.value];
    });

    document.getElementById("min-input").addEventListener("change", (e) => {
        update_range();
    });
    document.getElementById("max-input").addEventListener("change", (e) => {
        update_range();
    });

    [...document.getElementsByClassName("collapse-toggle")].forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            let target = document.querySelector(e.target.dataset.target);
            if (target.classList.contains("open")) {
                target.classList.remove("open");
                e.target.innerText = "show";
            } else {
                target.classList.add("open");
                e.target.innerText = "hide";
            }
            return false;
        });
    });


    //update_range();
});