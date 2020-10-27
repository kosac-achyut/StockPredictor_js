const token = 'Tsk_0576b4542fd34902bc7836fd4cbdfb87';
let timePortion = 7;
let epochs = 0;
let url = "";
const demo = "https://sandbox.iexapis.com/stable/stock/twtr/chart/6m?token=Tsk_0576b4542fd34902bc7836fd4cbdfb87";
let start = 0,end = 0;

const CNN_build = function (data) {
    return new Promise(function (resolve, reject) {

        console.log(data);
        const model = tf.sequential();

        model.add(tf.layers.inputLayer({
            inputShape: [7, 1],
        }));

        model.add(tf.layers.conv1d({
            kernelSize: 2,
            filters: 128,
            strides: 1,
            use_bias: true,
            activation: 'relu',
            kernelInitializer: 'VarianceScaling'
        }));

        model.add(tf.layers.averagePooling1d({
            poolSize: [2],
            strides: [1]
        }));

        model.add(tf.layers.conv1d({
            kernelSize: 2,
            filters: 64,
            strides: 1,
            use_bias: true,
            activation: 'relu',
            kernelInitializer: 'VarianceScaling'
        }));

        model.add(tf.layers.averagePooling1d({
            poolSize: [2],
            strides: [1]
        }));

        
        model.add(tf.layers.flatten({

        }));

        model.add(tf.layers.dense({ // to add linearity property
            units: 1,
            kernelInitializer: 'VarianceScaling',
            activation: 'linear'
        }));

        return resolve({
            'model': model,
            'data': data
        });
    });
}

const cnn = function (model, data, epochs, model_optimizer) {
    console.log("MODEL SUMMARY: ")
    alert('For Model Summary please press cmd+opt+J on Mac and control+shift+J on Windows ')
    model.summary();

    return new Promise(function (resolve, reject) {
        try {
            model.compile({ optimizer: model_optimizer, loss: 'meanSquaredError' });

            // Train the model
            model.fit(data.tensorTrainX, data.tensorTrainY, {
                epochs: epochs
            }).then(function (result) {
                /*for (let i = result.epoch.length-1; i < result.epoch.length; ++i) {
                    print("Loss after Epoch " + i + " : " + result.history.loss[i]);
                }*/
                print("Finished ∆∆∆∆");
                print("","br");
                print("Loss after last Epoch (" + result.epoch.length + ") is: " + result.history.loss[result.epoch.length-1]);
                resolve(model);
            })
        }
        catch (ex) {
            console.log('error');
        }
    });
}

let nn = 0;

$(document).ready(function () {

    $('#predict_button').click(function ()
    {

        // if(nn==1) {location.reload();nn=0;}
        const symbol = document.getElementById('stock-name').value;
        const chart_time = document.getElementById('stock-time').value;
        const model_optimizer = document.getElementById('model_optimizer').value;
        epochs = document.getElementById('epoch_input').value;

        if(symbol == "error" || chart_time == "error" || epochs < 0)
        {
            if(symbol == "error") {alert('Please select company name.'); return;}
            if(chart_time == "error") {alert('Please select chart time.'); return;}
            if(epochs < 0) {alert('Epoch Value should be positive.'); return;}
        }
        refresh_content();
        $("#predict_button").hide();
        nn = 1;

        
        if(token!='lol')
        url = "https://sandbox.iexapis.com/stable/stock/"+symbol+"/chart/"+chart_time+"?token="+token;
        else 
        url = demo;
        let start = performance.now();
        $.getJSON(url ,function(data){

            let labels = data.map(function (val) {return val['date'];});
            //console.log(labels);
            print("Getting Data for Stock : "+symbol);
            print("","br");
            print("Optimization Algorithm : "+model_optimizer);
            dataFeaturing(data, timePortion).then(function (result){

                print("Generating Features.....")
                let NDP = prediction_generator(result.originalData, result.timePortion); // nextdayprediction

                let P_date = (new Date(labels[labels.length-1] + 'T00:00:00.000')).addDays(1); //new predict date

                CNN_build(result).then(function (built){

                    print("Building CNN Model.....")
                     let tensorData = {
                        tensorTrainX: tf.tensor1d(built.data.trainX).reshape([built.data.size, built.data.timePortion, 1]),
                        tensorTrainY: tf.tensor1d(built.data.trainY)
                    };

                    let max = built.data.max;
                    let min = built.data.min;

                    print("Model Training and Testing.....");
                     cnn(built.model, tensorData, epochs , model_optimizer).then(function (model) {
                        
                       
                        var predictedX = model.predict(tensorData.tensorTrainX);
                        
                        
                        let next_prediction_normal = normalization(NDP, min, max);
                        
                        let next_prediction_tensor = tf.tensor1d(next_prediction_normal.data).reshape([1, built.data.timePortion, 1]);
                        
                        let predictedValue = model.predict(next_prediction_tensor);
                        
                        
                        predictedValue.data().then(function (p_val) {
                            
                            let predictedValue_rev = rev_normalization(p_val, min, max);

                            
                            predictedX.data().then(function (pred) {
                                
                                var predictedX_rev = rev_normalization(pred, min, max);

                                
                                predictedX_rev.data = Array.prototype.slice.call(predictedX_rev.data);
                                
                                predictedX_rev.data[predictedX_rev.data.length] = predictedValue_rev.data[0];
    
                               
                                var trainYInverse = rev_normalization(built.data.trainY, min, max);

                                $(".output-container").show();
                                let graph_plot = document.getElementById('linear-graph-plot');
                                 Plotly.newPlot( graph_plot, [{ x: labels, y: trainYInverse.data, name: "Stocks Prices" }],  { margin: { t: 0 } } );
                                 Plotly.plot( graph_plot, [{ x: labels, y: predictedX_rev.data, name: "Predicted Prices" }],  { margin: { t: 0 } } );
                                 $("#predict_button").show();
                            });

                            // Print the predicted stock price value for the next day
                            print("Predicted Stock Price of " + symbol + " for date " + moment(P_date).format("DD-MM-YYYY") + " is: " + predictedValue_rev.data[0].toFixed(3) + "$");
                            let end = performance.now();
                            let result = parseFloat((end - start)/1000);

                            print("Model Excution time: " + result.toPrecision(4) +" seconds");
                        });
                        
                    });



                });


            });

        });

        

    });
    
});