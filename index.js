const express = require('express');
const ytdl = require("ytdl-core")
const ffmpeg = require("fluent-ffmpeg")
const axios = require("axios")
const path = require("path");
const fs = require("fs");
const apiKey = require("./config.json")
// var play = require('play').Play();

const musicDir = './Music/'
// const videoDir = '/home/nil/Music'

var app = express()

app.set("port", process.env.PORT || 3000);
app.use(express.json())
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.listen(app.get("port"),"0.0.0.0", () => {
    console.log("Application is live in port: " + app.get("port"));
});

app.get("/", (req, res) => {
    res.render('index')
})

app.get("/play-music",(req,res) =>{
    res.render("play_music")
})

app.get("/api/v1/youtubesearch", async (req, res) => {
    let videoString = req.query.videoName

    let pageToken = (req.query.pageToken === undefined) ? "" : req.query.pageToken
    const params = new URLSearchParams([['part', 'snippet'], ['key', apiKey.API_KEI], ['type', 'video'], ['q', videoString], ['maxResults', 15], ['pageToken', pageToken]])
    let url = "https://www.googleapis.com/youtube/v3/search"



    let promise = axios.get(url, { params })
    let responseData = await promise.then((response) => response.data)
    retrunData = {}
    retrunData.nextPageToken = responseData.nextPageToken
    items = new Array()
    responseData.items.forEach(element => {
        items.push({
            videoId: element.id.videoId,
            title: element.snippet.title,
            thumbnailUrl: element.snippet.thumbnails.medium.url
        })
    });
    retrunData.items = items
    // for (each)
    res.send(retrunData);

});

app.get("/api/v1/downloadMp3", (req, res) => {
    let videoID = req.query.videoID;
    // let videoID = "nfs8NYg7yQM"
    if (ytdl.validateID(videoID)) {
        let videoUrl = `https://youtu.be/${videoID}`
        if (ytdl.validateURL(videoUrl)) {
            // console.log(videoUrl)
            // console.log("TRUE")
            let title = req.query.title
            // let title = 'Charlie Puth - Attention [Official Video]'
            let Mp3File = `${musicDir}/${title}.mp3`
            let mp4file = `${musicDir}/${title}.mp4`

            const video = ytdl(videoUrl, { quality: 'highestaudio' }).on("end", () => {
                console.log("Audio download end");
                ffmpeg(mp4file)
                    .format("mp3")
                    .output(fs.createWriteStream(Mp3File))
                    .on("error", (err) => {
                        console.log("An error occurred: " + err.message);
                    })
                    .on("end", () => {
                        console.log("Processing finished !");
                        // res.send("Download Done")
                        // res.send("Done")
                        fs.unlink(mp4file, err => {
                            if (err) {
                                throw err
                            }

                            console.log(`${mp4file} is deleted`)
                            console.log("Now put it into database")
                            res.send("Done")
                        })
                    })
                    .run();
            });

            video.pipe(fs.createWriteStream(mp4file));

            
        }
    }
})

app.get('/api/v1/play', (req, res) => {
    // play.sound('/home/nil/Music/MAJHEY MAJHEY TOBO - TAPOSH FEAT. MAHTIM SHAKIB : OMZ WIND OF CHANGE [ S:06 ].mp3');
    var music = 'Music/MAJHEY MAJHEY TOBO - TAPOSH FEAT. MAHTIM SHAKIB : OMZ WIND OF CHANGE [ S:06 ].mp3'; // filepath
    var stat = fs.statSync(music);
    range = req.headers.range;
    var readStream;

    // if there is no request about range
    if (range !== undefined) {
        // remove 'bytes=' and split the string by '-'
        var parts = range.replace(/bytes=/, "").split("-");

        var partial_start = parts[0];
        var partial_end = parts[1];

        if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
            return res.sendStatus(500);
        }
        // convert string to integer (start)
        var start = parseInt(partial_start, 10);
        // convert string to integer (end)
        // if partial_end doesn't exist, end equals whole file size - 1
        var end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
        // content length
        var content_length = (end - start) + 1;

        res.status(206).header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': content_length,
            'Content-Range': "bytes " + start + "-" + end + "/" + stat.size
        });

        // Read the stream of starting & ending part
        readStream = fs.createReadStream(music, { start: start, end: end });
    } else {
        res.header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size
        });
        readStream = fs.createReadStream(music);
    }
    readStream.pipe(res);
});