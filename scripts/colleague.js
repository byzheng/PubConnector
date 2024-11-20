function colleague(host) {
    let a_url = window.location.href;
    if (a_url == undefined) {
        return;
    }
    getColleague(a_url, "url", host);

}