
var path = require('path');
var fs = require('fs');

let token = '';
let domain = '';

global.appDir = path.resolve(__dirname);

//log
const opts = {
  errorEventName:'error',
      logDirectory:'log', // NOTE: folder must exist and be writable...
      fileNamePattern:'roll-<DATE>.log',
      dateFormat:'YYYY.MM.DD'
};

global.log = require('simple-node-logger').createRollingFileLogger( opts );

const readXlsxFile = require('read-excel-file/node')
const axios = require('axios')

let Total_Rows=0;
let Total_Success=0;
let Total_Error=0;

// File path.
console.info( `
===========================================================================================================================
        `)
readXlsxFile(appDir+'/input-data.xlsx').then(async(rows) => {

    
    Total_Rows = (rows.length);

    await Promise.all(rows.map(async (d,i) => {
        const data_json = JSON.parse(d);

        await axios.post(`https://${domain}/loketdesa/sim/backend/api/loket/${data_json.loket_id}/transaksis`, data_json, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
        }).then(async (data) => {
            if(data.status==201){
                await axios.post(`https://${domain}/loketdesa/sim/backend/api/transaksi/${data.data.data.id}/pembayaran`, {k_bayar:1, jumlah: data.data.data.attributes.total}, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                }).then(data2 => {
                    Total_Success+=1;

        console.info(`
            ROW      => ${i}
            STATUS   => ${data.status}
            RESPONSE => ${data.data.data.id}
            TRX => ${data2.status}
        `)
                
                });

            }else{
                Total_Error+=1;
        
        console.info(`
            ROW  => ${i}
            STATUS => ${err}
        `)

            }
        
        }).catch(err => {
            Total_Error+=1;
        console.info(`
            ROW  => ${i}
            STATUS => ${err}
        `)
        });
        
    })).then(() => {
        console.info( `
===========================================================================================================================
            Total Records : ${Total_Rows}
            Total Success : ${Total_Success}
            Total Error   : ${Total_Error}
===========================================================================================================================
        `)
    });
})

