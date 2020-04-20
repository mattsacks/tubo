import React, {useEffect, useRef, useState} from "react";
import {RNCamera} from "react-native-camera";
import {Camera, CameraCapturedPicture} from "expo-camera";
import {Text, TouchableOpacity, View} from "react-native";
import {askAsync, CAMERA} from "expo-permissions";
import {RouteProp} from "@react-navigation/native";
import {ScreenStack} from "../App";
import {StackNavigationProp} from "@react-navigation/stack";
import * as tensorflow from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import {style} from "./CameraScreen.style";

type CameraScreenProps = {
  navigation: StackNavigationProp<ScreenStack, 'Camera'>;
  route: RouteProp<ScreenStack, 'Camera'>;
};

export const CameraScreen = ({navigation}: CameraScreenProps) => {
  const ref = useRef<Camera>(null);

  const [permission, setPermission] = useState<boolean | null>(null);
  const [pressed, setPressed] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [type, setType] = useState<"front" | "back" | undefined>(RNCamera.Constants.Type.back);

  const onPress = () => {
    setPressed(true);
  };

  useEffect(() => {
    const request = async () => {
      const { status } = await askAsync(CAMERA);

      if (status === "granted") {
        setPermission(true);
      }
    };

    request()
      .catch((error) => {
        console.log(error)
      });

    const prepare = async () => {
      await tensorflow.ready();
    };

    prepare()
      .catch((error) => {
        console.log(error)
      })
      .then(() => {
        setReady(!ready);
      })
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
        console.log(error)
      })
      .then(() => {
        setPressed(false);
      });
  }, [pressed]);

  if (permission) {
    return (
      <View style={style.container}>
        <Camera ref={ref} style={style.preview} type={type}/>

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
