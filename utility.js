const normalization = (data, min, max) => // scale value between 0 - 1
{
    let n_data = data.map(function (value){ //normalised value
        return (value - min)/(max - min);
    });

    return {
        data : n_data,
        min  :  min,
        max  :  max,

    }
}

const rev_normalization = (data, min, max) => // reverse the normalization
{
    let n_data = data.map(function (value){
        return value * (max - min) + min;
    });

    return {
        data : n_data,
        min  :  min,
        max  :  max,
    }

}

const Min = (data) =>
{
    return Math.min(...data);
}

const Max = (data) => 
{
    return Math.max(...data);
}

const prediction_generator = (data , timePortion) =>
{
    let size = data.length;
    let features = [];

    for(let i = (size - timePortion); i < size; i++) {
        features.push(data[i]);
    }
    return features;
}


const dataFeaturing = (data , timePortion) => {
    return new Promise(function (resolve,reject) {
        let trainX = [], trainY = [], size = data.length;

        let features = [];
        for( let i = 0; i < size; i++){
            features.push(data[i]['close']);
        }

        var Sdata = normalization(features, Min(features), Max(features));
        let SFeature = Sdata.data;

        try {
            for(let i = timePortion; i < size; i++){
                for( let j = (i - timePortion); j < i; j++){
                    trainX.push(SFeature[j]);
                }
                trainY.push(SFeature[i]);
            }
        } catch (ex){
            resolve (ex);
            console.log(ex);
        }
        return resolve({
            size         : (size - timePortion),
            timePortion  : timePortion,
            trainX       : trainX,
            trainY       : trainY,
            min          : Sdata.min,
            max          : Sdata.max,
            originalData : features,  
        });
        
    });

};


Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

const print = function (text,element = "p") {
   $('.processing-block').show();
   let node = document.createElement(element);
   var textnode = document.createTextNode(text);
   node.appendChild(textnode);
   document.getElementById("process-card").appendChild(node);                        

    //console.log(text)
};




const refresh_content = () =>
{
    $(".output-container").hide();
    $("#predict_button").show();
    $("#process-card").html('');
    $(".processing-block").hide();
}