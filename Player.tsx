import React from 'react';
import {
  ActivityIndicator,
  Appearance,
  Button,
  Image,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Share
} from 'react-native';
import AirPlayButton from 'react-native-airplay-button';
import {CastButton, useRemoteMediaClient} from 'react-native-google-cast';
import Dialog, {
  DialogButton,
  DialogContent,
  DialogTitle,
  ScaleAnimation,
} from 'react-native-popup-dialog';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {nanoid} from 'nanoid';
import {useEffect, useState} from 'react';
import {LogBox} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import TrackPlayer, {State, usePlaybackState, useProgress} from 'react-native-track-player';
import Icon from 'react-native-vector-icons/FontAwesome';
import AppInfo from './AppInfo.json';
import styles from './styles';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

Icon.loadFont();

var MostRecentAppVersion = AppInfo.MostRecentAppVersion;

function GoogleChromeCast({route}) {
  const {streamID} = route.params;
  const client = useRemoteMediaClient();
  const [chromeCastData, setChromeCastData] = useState([]);

  useEffect(() => {
    const fetchChromeCastandPass = async () => {
      const resp = await fetch(
        `https://piratenzenders.com/wp-content/themes/pz/getinfoviajson.php?streamID=${streamID}`,
      );
      const ChromeCastInfo = await resp.json();
      setChromeCastData(ChromeCastInfo);


      if (client) {
        // Send the media to your Cast device as soon as we connect to a device
        // (though you'll probably want to call this later once user clicks on a video or something)
        client.loadMedia({
          mediaInfo: {
            contentUrl: ChromeCastInfo.streamURL,
            contentType: 'audio/mpeg',
            metadata: {
              images: [
                {
                  url: ChromeCastInfo.imageURL,
                },
              ],
              title: ChromeCastInfo.streamName,
              subtitle: ChromeCastInfo.nowPlaying,
              type: 'generic',
            },
          },
        });
      }
    };
    fetchChromeCastandPass();
  }, [client]);

  // This will automatically rerender when client is connected to a device
  // (after pressing the button that's rendered below)

  return (
    <View style={{marginTop: 7}}>
      <CastButton style={{width: 50, height: 60, tintColor: '#428bca'}} />
    </View>
  );
}

type Stream = {
  streamURL: string;
  streamName: string;
  imageURL: string;
  nowPlaying: string;
  desc: string;
  phone_app: string;
  phone_app_plus: string;
};

type Track = {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  url: string;
  description: string;
  phone_app: string;
  phone_app_plus: string;
};

function Player({navigation, route}) {
  const [Languages, setLanguages] = useState([]);
  const [streamData, setStreamData] = useState<Track>();
  const [colorValue, setColorValue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scaleAnimationDialog, setScaleAnimationDialog] = useState(false);
  const playbackState = usePlaybackState();
  const {streamID} = route.params;
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const { position, buffered, duration } = useProgress()
  const [isBuffering, setIsBuffering] = useState(false);


  const onShare = async () => {

    var titleToSplit = streamData.description.split('\r\n')
    var title = titleToSplit[0].trim();
    try {
      const result = await Share.share({
        message:
          `Ik ben aan het luisteren naar ${title} via Piratenzenders.com! Luister je mee via de app? Klik op deze link: https://piratenzenders.com/app/?streamID=${streamID}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // simple function to parse the stream data to an Track object, usable by the player
  const parseRawToTrackData = (rawData: Stream) => {
    return {
      title: rawData.streamName,
      artist: rawData.nowPlaying,
      artwork: rawData.imageURL,
      description: rawData.desc,
      url: rawData.streamURL,
      phone_app: rawData.phone_app,
      phone_app_plus: rawData.phone_app_plus,
    } as Track;
  };

  // Fetch stream data from server
  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetch(
        `https://piratenzenders.com/wp-content/themes/pz/getinfoviajson.php?streamID=${streamID}&promise=${Promise}`,
      );
      const RenderStreamScreen = await resp.json();
      const languagePacks = await fetchLanguagePacks();
      const parsedStreamData = parseRawToTrackData(RenderStreamScreen);
      setStreamData(parsedStreamData); // We parse the raw data to a track data object
      setLanguages(languagePacks); // We set the language packs
      setIsLoading(false); // We set the loading state to false
    };
    fetchData(); // We fetch the data by calling the async function
  }, []);

  // Creating a function to load the stream into the player.
  const loadNewStream = async (streamData: Track) => {
    const trackData = await TrackPlayer.getTrack(0);

    // If the track is already playing, then we don't want to load a new one, so we return immediately.
    if (trackData ? trackData.url === streamData.url : false) {
      return;
    }

    // Load the new track into the player.
    await TrackPlayer.pause(); // Pause the player before loading a new track.
    await TrackPlayer.add(streamData); // Add the new track to the player.
    await TrackPlayer.skipToNext(); // Skip to the next track in the player.
    await TrackPlayer.remove(0); // Remove the previous track from the player.

    // If the player is already playing, then we want to start playing the new track.
    if (playbackState === State.Playing) {
      TrackPlayer.play();
    }
  };



  const reAddTrack = async () => {
    const trackData = await TrackPlayer.getTrack(0);

    
    const fetchData = async () => {
      const Promise = nanoid();
      const resp = await fetch(
        `https://piratenzenders.com/wp-content/themes/pz/getinfoviajson.php?streamID=${streamID}&promise=${Promise}`,
      );
      const RenderStreamScreen = await resp.json();
      const parsedStreamData = parseRawToTrackData(RenderStreamScreen);
      setStreamData(parsedStreamData); // We parse the raw data to a track data object


    };
    fetchData(); // We fetch the data by calling the async function

  // Creating a function to load the stream into the player.
  const loadNewStream = async (streamData: Track) => {
    const trackData = await TrackPlayer.getTrack(0);


    // Load the new track into the player.
    await TrackPlayer.pause(); // Pause the player before loading a new track.
    await TrackPlayer.add(streamData); // Add the new track to the player.
    await TrackPlayer.skipToNext(); // Skip to the next track in the player.
    await TrackPlayer.remove(0); // Remove the previous track from the player.


  };

    // Check is streamData exists.
    if (streamData) {
      // If streamData exists, then we load the stream into the player.

      loadNewStream(streamData).then(() => {
        // If the player is already playing, then we want to start playing the new track immediately.
        if (playbackState === State.Playing) {
        }
      });
    }
}

  // Creating a function to load the stream into the player.
  useEffect(() => {
    
    
    // Check is streamData exists.
    if (streamData) {
      // If streamData exists, then we load the stream into the player.
      loadNewStream(streamData).then(() => {
        // If the player is already playing, then we want to start playing the new track immediately.
        if (playbackState === State.Playing) {
          TrackPlayer.play();
        }
      });
    }


    Appearance.addChangeListener(({ colorScheme }) => {

      setManualColorModeBySystem();
      getCurrentColorMode();

    });

    fetchLanguagePacks();
    nanoid();
    getCurrentColorMode();
  }, [streamData]);

  

  // Creating a function to toggle the player between playing and paused.
  const handlePlayPause = async () => {

    
    // If the player is playing, then we want to pause the player.
    if (playbackState != State.Playing) {
      await reAddTrack();
      await TrackPlayer.pause();
      setIsBuffering(true);


      setTimeout(() => {
        TrackPlayer.play();
      }, 1300)


      setTimeout(() => {
        setIsBuffering(false);
      }, 1400)
      
      // If the player is paused, then we want to play the player.
    } else {
      await TrackPlayer.pause();
      setIsBuffering(false);


      
    }


    
  };

  const colorScheme = colorValue;
  const themeContainerStyle =
    colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  const themeItemsStyle =
    colorScheme === 'light' ? styles.lightItems : styles.darkItems;

  const themeInnerHeadStyle =
    colorScheme === 'light'
      ? styles.innerHeadStyleLight
      : styles.innerHeadStyleDark;

  const themeInnerHeadStyleNews =
    colorScheme === 'light'
      ? styles.innerHeadStyleLightNews
      : styles.innerHeadStyleDarkNews;

  const themeInnerDescStyle =
    colorScheme === 'light'
      ? styles.innerDescStyleLight
      : styles.innerDescStyleDark;

  const themeHeaderStyle =
    colorScheme === 'light' ? styles.headerLight : styles.headerDark;

  const themeFooterStyle =
    colorScheme === 'light' ? styles.footerLight : styles.footerDark;

  const storeColorMode = async value => {
    try {
      await AsyncStorage.setItem('@ColorMode', value);
    } catch (e) {
      // saving error
    }
  };

  const setManualColorMode = async value => {
    storeColorMode(value);

    const ColorMode = await AsyncStorage.getItem('@ColorMode');
    setColorValue(ColorMode);
  };

  const setManualColorModeBySystem = async value => {
    const colorScheme = Appearance.getColorScheme();
    setManualColorMode(colorScheme);
  };

  const getCurrentColorMode = async value => {
    const ColorMode = await AsyncStorage.getItem('@ColorMode');

    setColorValue(ColorMode);
  };

  const getRandomString = length => {
    var randomChars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      result += randomChars.charAt(
        Math.floor(Math.random() * randomChars.length),
      );
    }
    return result;
  };

  const fetchLanguagePacks = async () => {
    var SystemLanguageOriginal = RNLocalize.getLocales().map(
      locale => locale.languageCode,
    );
    SystemLanguage = SystemLanguageOriginal[0].toString();

    if (SystemLanguage !== 'nl' && SystemLanguage !== 'de') {
      var SystemLanguage = 'en';
    }

    var Promise = nanoid();

    const resp = await fetch(
      `https://piratenzenders.com/assets/app/lang/${SystemLanguage}.json?promise=${Promise}`,
    );
    const languageData = await resp.json();
    return languageData;
  };

  const RemoveStreamByButton = async () => {
    if (Platform.OS === 'ios') {
      await TrackPlayer.reset();
      navigation.goBack();
    } else {
      await TrackPlayer.pause();
      navigation.goBack();
    }
  };


  if (playbackState === State.Ready) {
    var button = ( 
    
      <View style={styles.pauseButton}>
      <TouchableOpacity onPress={() => handlePlayPause()}>
        <Icon
          name={
            playbackState === State.Playing ? 'pause-circle-o' : 'play-circle-o'
          }
          size={40}
          style={styles.buttonStyle}
        />
      </TouchableOpacity>
    </View>
      );
  }


  if (isBuffering === false) {

    var button = ( 
      <View style={styles.playButton}>
      <TouchableOpacity onPress={() => handlePlayPause()}>
        <Icon
          name={
            playbackState === State.Playing ? 'pause-circle-o' : 'play-circle-o'
          }
          size={50}
          style={{color: '#428bca'}}
        />
      </TouchableOpacity>
    </View>
    );

  } else {

    var button = (
      <View style={styles.pauseButton}>
      <ActivityIndicator size="large" color='#428bca' style={{marginTop: 20}}/>
      </View>
  
      );
  

  }



  if (Platform.OS === 'ios') {
    var AirPlayButtonPlatform = (
      <AirPlayButton
        activeTintColor="blue"
        tintColor="red"
        style={{width: 50, height: 50, marginTop: 12, marginLeft: -10}}
      />
    );
  } else {
    var AirPlayButtonPlatform = <View />;
  }
  if (isLoading) {
    return null;
  }

  if (!streamData) {
    return null;
  }

  return (
    <View style={themeContainerStyle}>
      <Image
        resizeMode={'cover'}
        style={{width: '100%', height: '50%', backgroundColor: 'white'}}
        source={{uri: streamData?.artwork}}
      />
      <TouchableOpacity
        style={styles.backButtonStyle}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={30} style={{color: '#428bca'}} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.closeButtonStyle}
        onPress={() => RemoveStreamByButton()}>
        <Icon name="remove" size={30} style={{color: '#428bca'}} />
      </TouchableOpacity>
      <View style={styles.centerViewStyle}>
        <Text
          style={{
            fontWeight: 'bold',
            marginTop: 20,
            color: '#428bca',
            textAlign: 'center',
            fontSize: 18,
          }}>
          {streamData.title}
        </Text>
        <Text style={{color: '#757575', textAlign: 'center', fontSize: 18}}>
          {streamData?.description}
        </Text>
        <Text
          style={{
            color: '#757575',
            textAlign: 'center',
            textDecorationLine: 'underline',
            fontSize: 18,
          }}
          onPress={() => {
            setScaleAnimationDialog(true);
          }}>
          {streamData.phone_app}
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
          {button}
          <GoogleChromeCast route={route} />
          {AirPlayButtonPlatform}
          <TouchableOpacity onPress={() => onShare()}>
        <Icon
          name={
            'share'
          }
          size={30}
          style={styles.shareButton}
        />
      </TouchableOpacity>
        </View>
      </View>

      <Dialog
        onTouchOutside={() => {
          setScaleAnimationDialog(false);
        }}
        width={0.9}
        visible={scaleAnimationDialog}
        dialogAnimation={new ScaleAnimation()}
        onHardwareBackPress={() => {
          console.log('onHardwareBackPress');
          setScaleAnimationDialog(false);
          return true;
        }}
        dialogTitle={
          <DialogTitle
            title={Languages.lang_contactBanner}
            style={{
              backgroundColor: '#F7F7F8',
            }}
            hasTitleBar={false}
          />
        }
        actions={[
          <DialogButton
            text="DISMISS"
            onPress={() => {
              setScaleAnimationDialog(false);
            }}
            key="button-1"
          />,
        ]}>
        <DialogContent>
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 10,
                marginTop: 10,
              }}>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(`tel:${streamData.phone_app_plus}`)
                }
                style={{}}>
                <Image
                  resizeMode={'contain'}
                  style={{width: 50, height: 50, flexDirection: 'row'}}
                  source={{uri: 'https://piratenzenders.com/iOS/Phone50.png'}}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL(`sms:${streamData.phone_app}`)}
                style={{left: 10}}>
                <Image
                  resizeMode={'contain'}
                  style={{
                    width: 45,
                    height: 45,
                    marginRight: 10,
                    flexDirection: 'row',
                  }}
                  source={{uri: 'https://piratenzenders.com/iOS/SMS50.png'}}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    `whatsapp://send?phone=${streamData.phone_app}`,
                  )
                }
                style={{left: 10}}>
                <Image
                  resizeMode={'contain'}
                  style={{
                    width: 45,
                    height: 45,
                    marginLeft: 10,
                    flexDirection: 'row',
                  }}
                  source={{uri: 'https://piratenzenders.com/iOS/WhatsApp.png'}}
                />
              </TouchableOpacity>
            </View>

            <Button
              title={Languages.lang_closeButton}
              onPress={() => {
                setScaleAnimationDialog(false);
              }}
              style={{paddingTop: 10}}
              key="button-1"
            />
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}

export default Player;