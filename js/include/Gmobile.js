const G={
    map: null,
    ws3d_done:false,
    should_close:false,
    MediaRecorder:null,
    Cam:{
        t: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
        range: 0,
    },
    OLPark:     { lon: 127.1225, lat: 37.5203, ele: 150 },
    BackWoonDae:{ lon: 126.978118, lat: 37.658639, ele: 836.5 },
    GPS:{
        path: [],
        pathEntity: null,
        is_tracked: false,
        iEntity: null,
    },
    Marker: {
        pinkpin:"https://map.vworld.kr/images/v4map/pinkpin.png",
        bluekpin:"https://map.vworld.kr/images/v4map/bluepin.png",
        point: "https://map.vworld.kr/images/op02/map_point.png",
    },
    ScreenSpace:{
        sentinel: null,
        Event:{
            handler:null,
        },
    },
    Event:{
        Key:{
            ctrl:false,
            q:false,
        },

        OnClick:{
            loc: null,
            remover:null,
        },
    },
};
if(typeof window !== 'undefined') {window.G=G;}
