const Archiver = require('archiver');
const AWS = require('aws-sdk');
const Stream = require('stream');

const s3 = new AWS.S3( { apiVersion: '2006-03-01'} );
const streamPassThrough = new Stream.PassThrough();
const params = {
ACL: 'private',
Body: streamPassThrough,
Bucket: 'codepipeline-us-east-2-312282297207',
ContentType: 'application/zip',
Key: 'builk.zip',
StorageClass: 'STANDARD_IA', // Or as appropriate
};

const s3Upload = s3.upload(params, (error) => {
if (error) {
    console.error(`Got error creating stream to s3 ${error.name} ${error.message} ${error.stack}`);
    throw error;
}
});

s3Upload.on('httpUploadProgress', (progress) => {
console.log(progress); // { loaded: 4915, total: 192915, part: 1, key: 'foo.jpg' }
});

const archive = Archiver('zip');
archive.on('error', (error) => { throw new Error(`${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`); });


exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    console.log(response);
    const keys = [
        "bulk-file/thanhren.jpg",
        "bulk-file/tyren.jpg",
        "bulk-file/function.zip",
        "bulk-file/CODE-LAYOUT-BGP.rar"];
    console.log(keys);


    const s3DownloadStreams = keys.map((key) => {
        return {
            stream: s3.getObject({ Bucket: 'codepipeline-us-east-2-312282297207', Key: key }).createReadStream(),
            filename: key,
        };
    });

    await new Promise((resolve, reject) => {

        console.log('Starting upload');
        
        streamPassThrough.on('close', resolve);
        streamPassThrough.on('end', resolve);
        streamPassThrough.on('error', reject);
        
        archive.pipe(streamPassThrough);
        s3DownloadStreams.forEach((streamDetails) => archive.append(
            streamDetails.stream,
            { name: streamDetails.filename }
            ));
        archive.finalize();
        }).catch((error) => { throw new Error(`${error.code} ${error.message} ${error.data}`); });
        
        
        await s3Upload.promise();

};