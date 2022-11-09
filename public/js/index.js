// $(function () {
//     // Handler for .ready() called.
//     console.log("HIT")
// });

$('#submit-btn').on('click', () => {
    // e.preventDefault();
    // console.log("HIT")
    let videoNames = $('#videoName').val()
    // console.log(videoNames)
    if (videoNames === '') {
        console.log("EMPLY, request not send")
        return
    } else {

        $.ajax({
            type: "GET",
            url: "/api/v1/youtubesearch",
            data: { videoName: videoNames },
            success: function (res) {
                // console.log(res)
                generateDivs(res)
            },
            error: function () {
                console.log("error")
            }
        });
    }
})
function uniqId() {
    return Math.round(new Date().getTime() + (Math.random() * 100));
}

function generateDivs(res,string="None") {
    console.log(res)
    $('#next-token').val(res.nextPageToken)
    let html = ""
    res.items.forEach(element => {
        let uniqIdBtn = uniqId()
        html += `<div id='${uniqIdBtn}_div' class="col">` +
            `<img src=${element.thumbnailUrl} alt="Dinosaur" />` +
            // `<iframe src="https://www.youtube.com/embed/${element.videoId}" frameborder="1"></iframe>`+
            `<p id=${uniqIdBtn}_title><b>${element.title}</b></p>` +
            `<button id=${uniqIdBtn} onClick="send_download(${uniqIdBtn})">Download</button>` +
            `<input id=${uniqIdBtn}_vId type=hidden value=${element.videoId}></input>` +
            `</div>`
    });
    if (string === "append"){
    $('#youtube_div').append(html)
    }else{
        $('#youtube_div').html(html)
    }
    $('#more-btn').css('display', 'block')

}

$('#more-btn').on('click', () => {
    let videoNames = $('#videoName').val()
    let nextToken = $('#next-token').val()
    $.ajax({
        type: "GET",
        url: "/api/v1/youtubesearch",
        data: {
            videoName: videoNames,
            pageToken: nextToken
        },
        success: function (res) {
            // console.log(res)
            generateDivs(res,"append")
        },
        error: function () {
            console.log("error")
        }
    });
});

function send_download(id) {
    // console.log(`#${id}_vId`)
    let vID = $(`#${id}_vId`).val()
    let tit = $(`#${id}_title`).text();

    console.log(vID)
    console.log(tit)
    $.ajax({
        type: "GET",
        url: "/api/v1/downloadMp3",
        data: { videoID: $(`#${id}_vId`).val(), title: $(`#${id}_title`).text() },
        success: function (res) {
            // console.log(res)
            // console.log("DONE")
            alert("Download Complete")
            // generateDivs(res)
        },
        error: function () {
            console.log("error")
        }
    })
}