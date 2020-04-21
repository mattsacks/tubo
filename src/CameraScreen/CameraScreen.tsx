import React, {useEffect, useRef, useState} from "react";
import {Camera, CameraCapturedPicture} from "expo-camera";
import {Platform, Text, TouchableOpacity, View} from "react-native";
import {askAsync, CAMERA} from "expo-permissions";
import {RouteProp} from "@react-navigation/native";
import {ScreenStack} from "../App";
import {StackNavigationProp} from "@react-navigation/stack";
import * as tensorflow from '@tensorflow/tfjs';
import {style} from "./CameraScreen.style";
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

type CameraScreenProps = {
  navigation: StackNavigationProp<ScreenStack, 'Camera'>;
  route: RouteProp<ScreenStack, 'Camera'>;
};

const resource = "https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1";

const TensorCamera = cameraWithTensors(Camera);

export const CameraScreen = ({navigation}: CameraScreenProps) => {
  const ref = useRef<Camera>(null);

  const [graph, setGraph] = useState<tensorflow.GraphModel | null>();
  const [images, setImages] = useState<IterableIterator<tensorflow.Tensor3D>>();
  const [permission, setPermission] = useState<boolean | null>(null);
  const [pressed, setPressed] = useState<boolean>(false);

  useEffect(() => {
    const f = async () => {
      if (images) {
        const image = await images.next().value;

        console.info(image);

        if (image) {
          const inputs = {
            image_tensor: tensorflow.expandDims(image, 0)
          };

          const prediction = await graph?.executeAsync(inputs) as Array<tensorflow.Tensor>;

          const categories = prediction[0];
          const geometries = prediction[1];

          console.info(categories);
        }
      }
    };

    f()
      .catch((error) => {
        console.error(error);
      })
  }, [images]);

  const onReady = (images: IterableIterator<tensorflow.Tensor3D>) => {
    setImages(images);
  };

  const onPress = () => {
    setPressed(true);
  };

  useEffect(() => {
    const setup = async () => {
      const { status } = await askAsync(CAMERA);

      if (status === "granted") {
        setPermission(true);
      }

      await tensorflow.ready();

      const options = {
        fromTFHub: true,
        onProgress: (fraction: number) => {
          // console.info(fraction);
        }
      };

      return await tensorflow.loadGraphModel(resource, options);
    };

    setup()
      .then((graph) => {
        setGraph(graph);
      })
      .catch((error) => {
        console.error(error)
      });
  }, []);

  useEffect(() => {
    const capture = async () => {
      if (ref.current) {
        const options = {
          base64: true,
          quality: 0.5
        };

        const photo: CameraCapturedPicture = await ref.current.takePictureAsync(options);

        navigation.navigate('Image', {uri: photo.uri});
      }
    };

    capture()
      .catch((error) => {
        console.error(error)
      })
      .then(() => {
        setPressed(false);
      });
  }, [pressed]);

  let texture: {r: number; c: number;};
  if (Platform.OS === "ios") {
    texture = {r: 1920, c: 1080,};
  } else {
    texture = {r: 1200, c: 1600,};
  }

  if (permission) {
    return (
      <View style={style.container}>
        <TensorCamera
          autorender
          cameraTextureHeight={texture.r}
          cameraTextureWidth={texture.c}
          onReady={onReady}
          resizeDepth={3}
          resizeHeight={224}
          resizeWidth={224}
          style={style.preview}
          type={Camera.Constants.Type.front}
        />

        <View>
          <TouchableOpacity onPress={onPress} style={style.capture}>
            <Text>Snap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else {
    return <View />;
  }
};
