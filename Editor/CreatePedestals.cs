using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using Newtonsoft.Json.Linq;
using VRC.SDK3.Components;
using VRC.Udon;
using VRC.Udon.Common;
using VRC.Udon.Editor;
using VRC.Udon.Common.Interfaces;
using UdonSharpEditor;

// NOTE THIS FILE NEEDS TO BE PLACED INTO "Editor" FOLDER TO AVOID BUILD ERRORS

public class CreatePedestals : EditorWindow
{
    // public AbstractUdonProgramSource pedestalProgramSource;
    Object knownPedestalPrefab;
    Object knownSpeciesInfoPrefab;
    Transform knownPedestalParentTransform;
    Transform knownSpeciesParentTransform;
    int noImageCount = 0;
    // UdonQR knownUdonQr;

    [MenuItem("Create Pedestals/Create Pedestals")]
    static void Init()
    {
        EditorWindow.GetWindow(typeof (CreatePedestals));
    }

    void OnGUI()
    {
        // pedestalProgramSource = EditorGUILayout.ObjectField(pedestalProgramSource, typeof(AbstractUdonProgramSource), true) as AbstractUdonProgramSource;

        if (GUILayout.Button("Create")) {
            CreateAllSpecies();
            CreateAllPedestals();
        }
    }

    class JsonContents {
        public Species[] species;
        public Asset[] assets; 
    }

    class Species {
        public string id;
        public string pluralname;
        public string thumbnailurl;
    }

    class Asset {
        public string id;
        public string title;
        public string[] vrchatclonableavatarids;
        public string category;
        public string[] species;
        public string authorname;
    }

    T ReadJson<T>(string path) {
        return JObject.Parse(File.ReadAllText(path)).ToObject<T>();
    }

    Asset[] GetAssets() {
        string path = Application.dataPath + "/VRCArena World/Tools/CreatePedestals/test-assets.json";
        JsonContents contents = ReadJson<JsonContents>(path);
        return contents.assets;
    }

    void DeleteExistingPedestals() {
        foreach(GameObject gameObjectItem in GameObject.FindObjectsOfType<GameObject>()) {
            // a bit fragile here
            if (gameObjectItem != null && gameObjectItem.name == "AvatarPedestalPrefab(Clone)") {
                DestroyImmediate(gameObjectItem);
            }
        }
    }

    Species[] GetSpecies() {
        string path = Application.dataPath + "/VRCArena World/Tools/CreatePedestals/test-assets.json";
        JsonContents contents = ReadJson<JsonContents>(path);
        return contents.species;
    }

    void DeleteExistingSpecies() {
        foreach(GameObject gameObjectItem in GameObject.FindObjectsOfType<GameObject>()) {
            // a bit fragile here
            if (gameObjectItem != null && gameObjectItem.name == "SpeciesInfoPrefab(Clone)") {
                DestroyImmediate(gameObjectItem);
            }
        }
    }

    void CreateAllSpecies() {
        DeleteExistingSpecies();

        Species[] species = GetSpecies();

        Debug.Log("Found " + species.Length + " species");

        InsertInfoForSpecies(species);
    }

    void InsertInfoForSpecies(Species[] species) {
        int count = 0;
        foreach (Species speciesItem in species) {
            InsertInfoForSpeciesItem(speciesItem, count);
            count++;
        }
    }

    Transform GetSpeciesParentTransform() {
        if (knownSpeciesParentTransform) {
            return knownSpeciesParentTransform;
        }

        knownSpeciesParentTransform = GameObject.Find("/World/Species").transform;

        return knownSpeciesParentTransform;
    }

    void InsertInfoForSpeciesItem(Species speciesItem, int count) {
        Object speciesInfoPrefab = GetSpeciesInfoPrefab();
        Transform parentTransform = GetSpeciesParentTransform();

        Vector3 speciesInfoPosition = new Vector3(
            0,
            4f,
            0 + (count * 5) - 1f
        );

        GameObject speciesInfoObject = Instantiate(speciesInfoPrefab, speciesInfoPosition, Quaternion.identity, parentTransform) as GameObject;

        Material material = LoadSpeciesOverviewAsMaterial(speciesItem.id);
        
        GameObject wall = speciesInfoObject.transform.Find("Wall").gameObject;
        Renderer wallRenderer = wall.GetComponent<Renderer>();
        wallRenderer.material = material;

        // // not setting this is bad for performance
        // Canvas canvas = speciesInfoObject.transform.Find("Canvas").gameObject.GetComponent<Canvas>();
        // canvas.worldCamera = Camera.main;

        // Text label = speciesInfoObject.transform.Find("Canvas/Text").GetComponent<Text>();

        // label.text = speciesItem.pluralname;

        // Material material = LoadSpeciesThumbnailAsMaterial(speciesItem.id);

        // Image image = speciesInfoObject.transform.Find("Canvas/Image").GetComponent<Image>();
        // image.material = material;
    }

    Object GetSpeciesInfoPrefab() {
        if (knownSpeciesInfoPrefab) {
            return knownSpeciesInfoPrefab;
        }

        string pathToPrefabFile = "Assets/VRCArena World/Prefabs/SpeciesInfoPrefab.prefab";
        knownSpeciesInfoPrefab = AssetDatabase.LoadAssetAtPath(pathToPrefabFile, typeof(GameObject));

        return knownSpeciesInfoPrefab;
    }

    void CreateAllPedestals() {
        DeleteExistingPedestals();

        Asset[] assets = GetAssets();

        Debug.Log("Found " + assets.Length + " assets");

        InsertPedestalsForAssets(assets);
    }

    Object GetPedestalPrefab() {
        if (knownPedestalPrefab) {
            return knownPedestalPrefab;
        }

        string pathToPrefabFile = "Assets/VRCArena World/Prefabs/AvatarPedestalPrefab.prefab";
        knownPedestalPrefab = AssetDatabase.LoadAssetAtPath(pathToPrefabFile, typeof(GameObject));

        return knownPedestalPrefab;
    }

    Transform GetPedestalParentTransform() {
        if (knownPedestalParentTransform) {
            return knownPedestalParentTransform;
        }

        knownPedestalParentTransform = GameObject.Find("/World/Pedestals").transform;

        return knownPedestalParentTransform;
    }

    Texture2D LoadImageAsTexture(string filePath) {
        return (Texture2D)AssetDatabase.LoadAssetAtPath(filePath, typeof(Texture2D));

    //  Texture2D tex = null;
    //  byte[] fileData;
 
    //  if (File.Exists(filePath))     {
    //      fileData = File.ReadAllBytes(filePath);
    //      tex = new Texture2D(300, 300);
    //      tex.LoadImage(fileData);
    //  }
    //  return tex;
    }

    Texture2D LoadAssetThumbnailAsTexture(string assetId) {
        string pathToThumbnailPng = "Assets/VRCArena World/Tools/CreatePedestals/asset-data/" + assetId + "/thumb.jpg";
        return LoadImageAsTexture(pathToThumbnailPng);
    }

    Material CreateMaterial() {
        return new Material(Shader.Find("Standard"));
    }

    Material LoadAssetThumbnailAsMaterial(string assetId) {
        Texture2D texture = LoadAssetThumbnailAsTexture(assetId);

        Material material = CreateMaterial();
        material.mainTexture = texture;

        return material;
    }

    Texture2D LoadAssetOverviewAsTexture(string assetId) {
        string pathToImage = "Assets/VRCArena World/Tools/CreatePedestals/asset-data/" + assetId + "/overview.png";
        return LoadImageAsTexture(pathToImage);
    }

    Material LoadAssetOverviewAsMaterial(string assetId) {
        Texture2D texture = LoadAssetOverviewAsTexture(assetId);

        Material material = CreateMaterial();
        material.mainTexture = texture;

        return material;
    }

    Texture2D LoadSpeciesOverviewAsTexture(string speciesId) {
        string pathToImage = "Assets/VRCArena World/Tools/CreatePedestals/species-data/" + speciesId + "/overview.png";
        return LoadImageAsTexture(pathToImage);
    }

    Material LoadSpeciesOverviewAsMaterial(string speciesId) {
        Texture2D texture = LoadSpeciesOverviewAsTexture(speciesId);

        Material material = CreateMaterial();
        material.mainTexture = texture;

        return material;
    }

    Texture2D LoadSpeciesThumbnailAsTexture(string speciesId) {
        string pathToThumbnailPng = "Assets/VRCArena World/Tools/CreatePedestals/species-data/" + speciesId + "/thumb.jpg";
        return LoadImageAsTexture(pathToThumbnailPng);
    }

    Material LoadSpeciesThumbnailAsMaterial(string speciesId) {
        Texture2D texture = LoadSpeciesThumbnailAsTexture(speciesId);

        Material material = CreateMaterial();
        material.mainTexture = texture;

        return material;
    }

    // UdonQR GetUdonQrLibrary() {
    //     if (knownUdonQr) {
    //         return knownUdonQr;
    //     }

    //     knownUdonQr = GameObject.Find("/UdonQR").gameObject.GetComponent<UdonQR>();

    //     return knownUdonQr;
    // }

    void InsertPedestalForAsset(Asset asset, int assetCount, int speciesCount) {
        Vector3 pedestalPosition = new Vector3(
            2f + (assetCount * 4),
            0,
            0 + (speciesCount * 5)
        );

        Object pedestalPrefab = GetPedestalPrefab();
        Transform parentTransform = GetPedestalParentTransform();

        GameObject pedestalObject = Instantiate(pedestalPrefab, pedestalPosition, Quaternion.Euler(0, 270, 0), parentTransform) as GameObject;

        VRCArenaPedestal vrcarenaPedestal = pedestalObject.GetUdonSharpComponent<VRCArenaPedestal>();
        vrcarenaPedestal.searchText = asset.title + " by " + asset.authorname;
        vrcarenaPedestal.ApplyProxyModifications();

        Material material = LoadAssetOverviewAsMaterial(asset.id);
        
        GameObject wall = pedestalObject.transform.Find("VisibilityWrapper/Wall").gameObject;
        Renderer wallRenderer = wall.GetComponent<Renderer>();
        wallRenderer.material = material;

        // // not setting this is bad for performance
        // Canvas canvas = pedestalObject.transform.Find("VisibilityWrapper/Canvas").gameObject.GetComponent<Canvas>();
        // canvas.worldCamera = Camera.main;

        // Text pedestalText = pedestalObject.transform.Find("VisibilityWrapper/Canvas/Text").GetComponent<Text>();
        // pedestalText.text = asset.title + " by " + asset.authorname;

        // string url = "https://www.vrcarena.com/assets/" + asset.id;

        // Text urlText = pedestalObject.transform.Find("VisibilityWrapper/Canvas/TextUrl").GetComponent<Text>();
        // urlText.text = url;

        // UdonQRCanvasSetter qrCanvas = pedestalObject.transform.Find("VisibilityWrapper/QRCanvas").gameObject.GetUdonSharpComponentInChildren<UdonQRCanvasSetter>();
        // qrCanvas._qrLibrary = GetUdonQrLibrary();
        // qrCanvas.Set(url);

        // Material material = LoadAssetThumbnailAsMaterial(asset.id);

        // Image image = pedestalObject.transform.Find("VisibilityWrapper/Canvas/Image").GetComponent<Image>();
        // image.material = material;

        GameObject vrcPedestal = pedestalObject.transform.Find("VisibilityWrapper/AvatarPedestal").gameObject;
        VRCAvatarPedestal pedestal = vrcPedestal.GetComponent<VRCAvatarPedestal>();

        // remove it so save FPS
        if (asset.vrchatclonableavatarids == null || asset.vrchatclonableavatarids.Length == 0) {
            DestroyImmediate(vrcPedestal);
            return;
        }

        if (asset.vrchatclonableavatarids != null && asset.vrchatclonableavatarids.Length > 0) {
            string primaryVrchatAvatarId = asset.vrchatclonableavatarids[0];
            pedestal.blueprintId = primaryVrchatAvatarId;
        } else {
            pedestal.blueprintId = "";
        }
    }

    void InsertPedestalsForAssets(Asset[] assets) {
        Dictionary<string, List<Asset>> assetsBySpecies = new Dictionary<string, List<Asset>>();

        Species[] species = GetSpecies();

        foreach (Species speciesItem in species) {
            assetsBySpecies.Add(speciesItem.id, new List<Asset>());
        }

        foreach (Asset asset in assets) {
            if (asset.species == null) {
                continue;
            }

            foreach (string speciesId in asset.species) {
                if (assetsBySpecies.ContainsKey(speciesId)) {
                    assetsBySpecies[speciesId].Add(asset);
                }
            }
        }

        int speciesCount = 0;
        int maxAssetsInARow = 0;
        
        noImageCount = 0;

        foreach (var item in assetsBySpecies) {
            Asset[] assetsForSpecies = item.Value.ToArray();
            int assetCount = 0;

            Debug.Log("There are " + assetsForSpecies.Length + " assets in this species");

            foreach (Asset asset in assetsForSpecies) {
                InsertPedestalForAsset(asset, assetCount, speciesCount);
                assetCount++;
            }

            speciesCount++;

            if (assetsForSpecies.Length > maxAssetsInARow) {
                maxAssetsInARow = assetsForSpecies.Length;
            }
        }

        SetMaxAssetsInARow(maxAssetsInARow);
    }

    void SetMaxAssetsInARow(int maxAssetsInARow) {
        VRCArenaWorld world = GameObject.Find("World").GetUdonSharpComponent<VRCArenaWorld>();
        world.maxAssetsInARow = maxAssetsInARow;
        world.ApplyProxyModifications();
    }
}
