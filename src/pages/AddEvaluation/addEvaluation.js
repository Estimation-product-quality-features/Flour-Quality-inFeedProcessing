import React from 'react';
// import { View, Image, StyleSheet } from 'react-native';
import './addEvaluation.css';

import { Button } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Grid from '@material-ui/core/Grid';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardMedia from '@material-ui/core/CardMedia';
import Card from '@material-ui/core/Card';

import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
//import Image from '@material-ui/core/Image';
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import Paper from '@material-ui/core/Paper';
import Index, { ObjectDetector } from "../../components/Index";
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ModelMenu from '../../components/ModelMenu';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

// Image imports
import corn from './images/corn.jpeg';
import corn2 from './images/corn2.jpeg';
import wheat from './images/wheat.jpeg';
import wheat2 from './images/wheat2.jpeg'; 
import triticale from './images/triticale.jpeg';
import triticale2 from './images/triticale2.jpeg';
import rays from './images/rays.jpeg';
import rays2 from './images/rays2.jpeg';

//tensorflow
import * as tf from '@tensorflow/tfjs';
import {loadGraphModel} from '@tensorflow/tfjs-converter';
tf.setBackend('webgl');

let classesDir = {
  1: {
      name: 'Corn',
      id: 1,
  },
  2: {
      name: 'Rays',
      id: 2,
  },
  3: {
    name: 'Triticale',
    id: 3,
  },
  4: {
    name: 'Wheat',
    id: 4,
  }
}

async function load_rcnn_model() {
  // It's possible to load the model locally or from a repo
  // You can choose whatever IP and PORT you want in the "http://127.0.0.1:8080/model.json" just set it before in your https server
  //const model = await loadGraphModel("http://127.0.0.1:8080/model.json");

  const model = await loadGraphModel('/models/rcnn_js/model.json');
  return model;
}

async function load_ssd_model() {
  const model = await tf.loadGraphModel('/models/ssd_js/model.json');
  return model;
}

function process_input(img){
  const tfimg = tf.browser.fromPixels(img).toInt();
  const expandedimg = tfimg.transpose([0,1,2]).expandDims();
  return expandedimg;
};

function detectFrame(img_url, model) {
    var img = new Image();
    img.src = {img_url};
    console.log(img_url)
    img.id = "imgCanvas";
    img.width = 512 //has to be defined for tensorflow pixel
    img.height = 512 // ^^
    // img.style="display: none;"
    //needs to be appended somewhere else or otherwise be made visible
    document.body.append(img);

    Promise.all([model])
        .then(values => {
          tf.engine().startScope();
          console.log(values[0])
          values[0].executeAsync(process_input(img)).then(predictions => {
            // console.log(predictions)
            renderPredictions(predictions, img);
          tf.engine().endScope();
        })
        .catch(error => {
          console.error(error);
        });

  });
};

function buildDetectedObjects(scores, threshold, boxes, classes, classesDir) {
  const detectionObjects = []
  var imgCanvas = document.getElementById('imgCanvas');
  scores[0].forEach((score, i) => {
    if (score > threshold) {
      const bbox = [];
      const minY = boxes[0][i][0] * imgCanvas.offsetHeight;
      const minX = boxes[0][i][1] * imgCanvas.offsetWidth;
      const maxY = boxes[0][i][2] * imgCanvas.offsetHeight;
      const maxX = boxes[0][i][3] * imgCanvas.offsetWidth;
      bbox[0] = minX;
      bbox[1] = minY;
      bbox[2] = maxX - minX;
      bbox[3] = maxY - minY;
      console.log(i)
      detectionObjects.push({
        class: classes[i],
        label: classesDir[classes[i]].name,
        score: score.toFixed(4),
        bbox: bbox
      })
    }
  })
  return detectionObjects
}


function renderPredictions(predictions) {

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    //Getting predictions
    //detection_boxes, detection_classes, detection_scores, num_detections
    const boxes = predictions[0].arraySync();
    const classes = predictions[1].dataSync();
    const scores = predictions[2].arraySync();
    const num = predictions[3].arraySync();

    console.log("BoxesNumber of detections")
    console.log(boxes)
    console.log("Classes")
    console.log(classes)
    console.log("Scores")
    console.log(scores)
    console.log("Number of detections")
    console.log(num)
    const detections = buildDetectedObjects(scores, threshold,
                                    boxes, classes, classesDir);

    detections.forEach(item => {
      const x = item['bbox'][0];
      const y = item['bbox'][1];
      const width = item['bbox'][2];
      const height = item['bbox'][3];

      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(item["label"] + " " + (100 * item["score"]).toFixed(2) + "%").width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
  });

  detections.forEach(item => {
    const x = item['bbox'][0];
    const y = item['bbox'][1];

    // Draw the text last to ensure it's on top.
    ctx.fillStyle = "#000000";
    ctx.fillText(item["label"] + " " + (100*item["score"]).toFixed(2) + "%", x, y);
  });
};


const itemData = [
  {
    img: corn,
    title: 'Corn',
  },
    {
    img: wheat,
    title: 'Wheat',
  },
  {
    img: triticale,
    title: 'Triticale',
  },
  {
    img: rays,
    title: 'Rays',
  },
  {
    img: corn2,
    title: 'Corn',
  },
  {
    img: wheat2,
    title: 'Wheat',
  },
  {
    img: triticale2,
    title: 'Triticale',
  },
  {
    img: rays2,
    title: 'Rays',
  },
  
];

// the Threshhold for the detected objects, the user could also choose it
var threshold = 0.005;
const model_ssd = load_ssd_model();
const model_rcnn = load_rcnn_model();
var currentModel = load_ssd_model();

// Canvas to draw on
var canvasRef = React.createRef();

class AddEvaluation extends React.Component {
  constructor(props){
    super(props);
    this.state= {
      imgPred: "images/pred_init.svg"
    };
    var x = null
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleClickCard = this.handleClickCard.bind(this)
  }

  /////////////////////////////////////////////////////////
  // Handle changes
  /////////////////////////////////////////////////////////
  handleInputChange(event) {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.setState({
      imgPred: URL.createObjectURL(event.target.files[0])
    })
  }

  handleClickCard(img) {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.setState({
      imgPred: img
    })
  }

  handleMenuChange(event) {
    // var modelName = event.target.value;
    // if (modelName.match("SSD")) {
    //     currentModel = load_ssd_model();
    // } else if (modelName.match("RCNN")) {
    //     currentModel = load_rcnn_model();;
    // }
    currentModel = event.target.value;
  }

  handleClickCard2(imgSrc) {
    const ctx = canvasRef.current.getContext("2d");
    var img = new Image()
    img.onload = function() {
      ctx.drawImage(img, 0, 0);
    };
    img.src = imgSrc
  }

  returnImage(img) {
    this.setState({
      imgPred: img
    })
  }


  render() {
    return (
        <div className= "Detection">
        <><Navbar />
        {/* Some spacing  */}
        <br></br> <br></br> <br></br> <br></br>
        <br></br> <br></br> <br></br> <br></br>

        <Container>
          <Grid container spacing={6}>
            <Grid 
              container
              direction='row'
              spacing={2}
              lignItems="center"
              justifyContent="center"
              >
              <Grid item>
              <h1>Select an image</h1>
                <ImageList sx={{heigth:128, width:128}} cols={4} rowHeight={256}>
                    {itemData.map((item) => (
                      <ImageListItem key={item.img}>
                            <CardActionArea>
                              <CardMedia
                                component="img"
                                src={`${item.img}?w=164&h=164&fit=crop&auto=format`}
                                srcSet={item.img}
                                alt={item.title}
                                title={item.title}
                                height='256'
                                onClick={() => this.handleClickCard(item.img)}
                                />
                            </CardActionArea>
                      </ImageListItem>
                    ))}
                  </ImageList>
              </Grid>
           </Grid>
            

            <Grid 
              container
              direction='row'
              spacing={2}
              lignItems="center"
              justifyContent="center"
              >
              <Grid item>


                  
                  <h1>Model Detection</h1>
                  <Card>
                  <div id="wrapper">
                    <img src={this.state.imgPred} alt="predict image"/>
                  <canvas
                        className="size"
                        id="canvasTop"
                        ref={canvasRef}
                        width="512"
                        height="512"
                      />
                 </div>

                  </Card>
                  <input type="file" onChange={this.handleInputChange}/>
              </Grid>
              <Grid item>
                <Grid 
                  container
                  direction='column'
                  spacing={4}
                  lignItems="center"
                  justifyContent="center"
                  >
                    <Grid item ></Grid>
                    <Grid item ></Grid>
                    <Grid item ></Grid>
                    <Grid item ></Grid>
                    <Grid item xs={1/2}>
                    <Box sx={{height:'auto', width: 'auto'}}>
                      <FormControl fullWidth variant="filled" color='inherit'>
                          <InputLabel id="modelInput">Select model</InputLabel>
                          <Select
                              labelId="modelLabel"
                              id="modelID"
                              // value={currentModel}
                              label="Model"
                              // displayEmpty
                              variant="filled"
                              color='inherit'
                              onChange={this.handleMenuChange}
                          >
                          <MenuItem value={model_ssd}>SSD mobilenetV1</MenuItem>
                          <MenuItem value={model_rcnn}>RCNN</MenuItem>
                          </Select>
                      </FormControl>
                  </Box>
                    </Grid>
                    <Grid item xs={1/2}>
                      <Button
                       variant="contained"
                       color='inherit'
                       size='large'
                       onClick={() => detectFrame(this.state.imgPred, currentModel)}>
                      Predict Image
                      </Button>
                    </Grid>


                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
        {/* Some spacing  */}
        <br></br> <br></br> <br></br> <br></br>
        <br></br> <br></br> <br></br> <br></br>

        <Footer />
        </>
        </div>
        );
    }
  }

 export default AddEvaluation;


