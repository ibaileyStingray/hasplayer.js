// Mp4 box-level manipulation library
// (C) 2013 Orange

var mp4lib = (function() {
    var mp4lib = {
        boxes:{},
        fieldProcessors:{},
        fields:{},

        // In debug mode, source data buffer is kept for each of deserialized box so any 
        // structural deserialization problems can be traced by serializing each box
        // and comparing the resulting buffer with the source buffer.
        // This greatly increases memory consumption, so it is turned off by default.
        debug:false,

        // A handler function may be hooked up to display warnings.
        // A warning is typically non-critical issue, like unknown box in data buffer.
        warningHandler:function(message){
            console.log(message);
        }
    };

    var boxTypeArray = {};
    var extendedBoxTypeArray = {};

    mp4lib.registerTypeBoxes = function() {
        boxTypeArray["moov"] = mp4lib.boxes.MovieBox;
        boxTypeArray["moof"] = mp4lib.boxes.MovieFragmentBox;
        boxTypeArray["ftyp"] = mp4lib.boxes.FileTypeBox;
        boxTypeArray["mfhd"] = mp4lib.boxes.MovieFragmentHeaderBox;
        boxTypeArray["mfra"] = mp4lib.boxes.MovieFragmentRandomAccessBox;
        boxTypeArray["udta"] = mp4lib.boxes.UserDataBox;
        boxTypeArray["trak"] = mp4lib.boxes.TrackBox;
        boxTypeArray["edts"] = mp4lib.boxes.EditBox;
        boxTypeArray["mdia"] = mp4lib.boxes.MediaBox;
        boxTypeArray["minf"] = mp4lib.boxes.MediaInformationBox;
        boxTypeArray["dinf"] = mp4lib.boxes.DataInformationBox;
        boxTypeArray["stbl"] = mp4lib.boxes.SampleTableBox;
        boxTypeArray["mvex"] = mp4lib.boxes.MovieExtendsBox;
        boxTypeArray["traf"] = mp4lib.boxes.TrackFragmentBox;
        boxTypeArray["meta"] = mp4lib.boxes.MetaBox;
        boxTypeArray["mvhd"] = mp4lib.boxes.MovieHeaderBox;
        boxTypeArray["mdat"] = mp4lib.boxes.MediaDataBox;
        boxTypeArray["free"] = mp4lib.boxes.FreeSpaceBox;
        boxTypeArray["sidx"] = mp4lib.boxes.SegmentIndexBox;
        boxTypeArray["tkhd"] = mp4lib.boxes.TrackHeaderBox;
        boxTypeArray["mdhd"] = mp4lib.boxes.MediaHeaderBox;
        boxTypeArray["mehd"] = mp4lib.boxes.MovieExtendsHeaderBox;
        boxTypeArray["hdlr"] = mp4lib.boxes.HandlerBox;
        boxTypeArray["stts"] = mp4lib.boxes.TimeToSampleBox;
        boxTypeArray["stsc"] = mp4lib.boxes.SampleToChunkBox;
        boxTypeArray["stco"] = mp4lib.boxes.ChunkOffsetBox;
        boxTypeArray["trex"] = mp4lib.boxes.TrackExtendsBox;
        boxTypeArray["vmhd"] = mp4lib.boxes.VideoMediaHeaderBox;
        boxTypeArray["smhd"] = mp4lib.boxes.SoundMediaHeaderBox;
        boxTypeArray["dref"] = mp4lib.boxes.DataReferenceBox;
        boxTypeArray["url "] = mp4lib.boxes.DataEntryUrlBox;
        boxTypeArray["urn "] = mp4lib.boxes.DataEntryUrnBox;
        boxTypeArray["tfhd"] = mp4lib.boxes.TrackFragmentHeaderBox;
        boxTypeArray["tfdt"] = mp4lib.boxes.TrackFragmentBaseMediaDecodeTimeBox;
        boxTypeArray["trun"] = mp4lib.boxes.TrackFragmentRunBox;
        boxTypeArray["stsd"] = mp4lib.boxes.SampleDescriptionBox;
        boxTypeArray["sdtp"] = mp4lib.boxes.SampleDependencyTableBox;
        boxTypeArray["avc1"] = mp4lib.boxes.AVC1VisualSampleEntryBox;
        boxTypeArray["encv"] = mp4lib.boxes.EncryptedVideoBox;
        boxTypeArray["avcC"] = mp4lib.boxes.AVCConfigurationBox;
        boxTypeArray["pasp"] = mp4lib.boxes.PixelAspectRatioBox;
        boxTypeArray["mp4a"] = mp4lib.boxes.MP4AudioSampleEntryBox;
        boxTypeArray["enca"] = mp4lib.boxes.EncryptedAudioBox;
        boxTypeArray["esds"] = mp4lib.boxes.ESDBox;
        boxTypeArray["stsz"] = mp4lib.boxes.SampleSizeBox;
        boxTypeArray["pssh"] = mp4lib.boxes.ProtectionSystemSpecificHeaderBox;
        boxTypeArray["saiz"] = mp4lib.boxes.SampleAuxiliaryInformationSizesBox;
        boxTypeArray["saio"] = mp4lib.boxes.SampleAuxiliaryInformationOffsetsBox;
        boxTypeArray["sinf"] = mp4lib.boxes.ProtectionSchemeInformationBox;
        boxTypeArray["schi"] = mp4lib.boxes.SchemeInformationBox;
        boxTypeArray["tenc"] = mp4lib.boxes.TrackEncryptionBox;
        boxTypeArray["schm"] = mp4lib.boxes.SchemeTypeBox;
        boxTypeArray["elst"] = mp4lib.boxes.EditListBox;
        boxTypeArray["hmhd"] = mp4lib.boxes.HintMediaHeaderBox;
        boxTypeArray["nmhd"] = mp4lib.boxes.NullMediaHeaderBox;
        boxTypeArray["ctts"] = mp4lib.boxes.CompositionOffsetBox;
        boxTypeArray["cslg"] = mp4lib.boxes.CompositionToDecodeBox;
        boxTypeArray["stss"] = mp4lib.boxes.SyncSampleBox;
        boxTypeArray["tref"] = mp4lib.boxes.TrackReferenceBox;
        boxTypeArray["frma"] = mp4lib.boxes.OriginalFormatBox;
    };

     mp4lib.registerExtendedTypeBoxes = function() {
        extendedBoxTypeArray[JSON.stringify([0x6D, 0x1D, 0x9B, 0x05, 0x42, 0xD5, 0x44, 0xE6, 0x80, 0xE2, 0x14, 0x1D, 0xAF, 0xF7, 0x57, 0xB2])] = mp4lib.boxes.TfxdBox;
        extendedBoxTypeArray[JSON.stringify([0xD4, 0x80, 0x7E, 0xF2, 0xCA, 0x39, 0x46, 0x95, 0x8E, 0x54, 0x26, 0xCB, 0x9E, 0x46, 0xA7, 0x9F])] = mp4lib.boxes.TfrfBox;
        extendedBoxTypeArray[JSON.stringify([0xD0, 0x8A, 0x4F, 0x18, 0x10, 0xF3, 0x4A, 0x82, 0xB6, 0xC8, 0x32, 0xD8, 0xAB, 0xA1, 0x83, 0xD3])] = mp4lib.boxes.PiffProtectionSystemSpecificHeaderBox;
        extendedBoxTypeArray[JSON.stringify([0x89, 0x74, 0xDB, 0xCE, 0x7B, 0xE7, 0x4C, 0x51, 0x84, 0xF9, 0x71, 0x48, 0xF9, 0x88, 0x25, 0x54])] = mp4lib.boxes.PiffTrackEncryptionBox;
        extendedBoxTypeArray[JSON.stringify([0xA2, 0x39, 0x4F, 0x52, 0x5A, 0x9B, 0x4F, 0x14, 0xA2, 0x44, 0x6C, 0x42, 0x7C, 0x64, 0x8D, 0xF4])] = mp4lib.boxes.PiffSampleEncryptionBox;
     };

    mp4lib.constructorTypeBox = function (type) {
        var obj, args;
        obj = Object.create(type.prototype);
        args = Array.prototype.slice.call(arguments, 1);
        type.apply(obj, args);
        return obj;
    };

    mp4lib.searchBox = function ( boxtype, uuid ){
        var boxType;
        if (uuid) {
            boxType = extendedBoxTypeArray[uuid];
        }
        else {
            boxType = boxTypeArray[boxtype];
        }
        
        if (!boxType){
            boxType = mp4lib.boxes.UnknownBox;
        }

        return boxType;
    };
           
    mp4lib.createBox = function( boxtype, uuid ) { 
        return mp4lib.constructorTypeBox.apply(null, [mp4lib.searchBox(boxtype,uuid)]);
    };
    
    /**
    deserialize binary data (uint8array) into mp4lib.File object
    */
    mp4lib.deserialize = function(uint8array) {
        var f = new mp4lib.boxes.File();
        var p = new mp4lib.fieldProcessors.DeserializationBoxFieldsProcessor(f, uint8array, 0, uint8array.length);
        f._processFields(p);
        return f;
    };

    /**
    serialize box (or mp4lib.File) into binary data (uint8array)
    */
    mp4lib.serialize = function(f) {
        var file_size = f.getLength();
        var uint8array = new Uint8Array(file_size);
        var sp = new mp4lib.fieldProcessors.SerializationBoxFieldsProcessor(f, uint8array, 0);
        f._processFields(sp);
        return uint8array;
    };

    /**
    exception thrown when binary data is malformed
    it is thrown typically during deserialization
    */
    mp4lib.ParseException = function(message) {
        this.message = message;
        this.name = "ParseException";
    };

    /**
    exception thrown when box objects contains invalid data, 
    ex. flag field is are not coherent with fields etc.
    it is thrown typically during object manipulation or serialization
    */
    mp4lib.DataIntegrityException = function(message) {
        this.message = message;
        this.name = "DataIntegrityException";
    };

    return mp4lib;
})();

// This module is intended to work both on node.js and inside browser.
// Since these environments differ in a way modules are stored/accessed,
// we need to export the module in the environment-dependant way

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = mp4lib; // node.js
else
    window.mp4lib = mp4lib;  // browser

