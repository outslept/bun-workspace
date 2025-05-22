import { expect, it } from "bun:test";
import { parseBunWorkspace } from ".";

it("should handle catalog operations", () => {
  const input = {
    workspaces: {
      catalog: {
        "@unocss/core": "^0.66.0",
        react: "^18.2.0",
      },
      catalogs: {
        react18: {
          next: "^14.0.0",
          "react-dom": "^18.2.0",
          react: "^18.2.0",
        },
        react19: {
          react: "^19.0.0",
        },
      },
    },
  };

  const workspace = parseBunWorkspace(JSON.stringify(input));

  workspace.setPackage("react18", "@vue/compiler-sfc", "^3.0.0");
  workspace.setPackage("react18", "vue", "^3.0.0");
  workspace.setPackage("react18", "react", "^18.3.0");
  workspace.setPackage("react19", "react", "^19.1.0");

  expect(workspace.getPackageCatalogs("react")).toEqual([
    "react18",
    "react19",
    "default",
  ]);
  expect(workspace.getCatalogVersion("react18", "vue")).toBe("^3.0.0");
  expect(workspace.getCatalogVersion("react19", "react")).toBe("^19.1.0");

  expect(workspace.getCatalogPackages("react18")).toEqual({
    next: "^14.0.0",
    "react-dom": "^18.2.0",
    react: "^18.3.0",
    "@vue/compiler-sfc": "^3.0.0",
    vue: "^3.0.0",
  });
});

it("should initialize empty workspace correctly", () => {
  const workspace = parseBunWorkspace(JSON.stringify({ workspaces: {} }));

  workspace.setPackage("default", "react", "^18.2.0");
  workspace.setPackage("vue", "vue", "^3.0.0");

  expect(workspace.getCatalogVersion("default", "react")).toBe("^18.2.0");
  expect(workspace.getCatalogVersion("vue", "vue")).toBe("^3.0.0");
  expect(workspace.listCatalogs()).toEqual(["default", "vue"]);
  expect(workspace.getCatalogPackages("default")).toEqual({ react: "^18.2.0" });
  expect(workspace.getCatalogPackages("vue")).toEqual({ vue: "^3.0.0" });
});

it("should manage catalogs correctly", () => {
  const workspace = parseBunWorkspace(JSON.stringify({ workspaces: {} }));

  workspace.createCatalog("test");
  workspace.setCatalogVersion("test", "package", "1.0.0");
  expect(workspace.getCatalogVersion("test", "package")).toBe("1.0.0");

  workspace.removeCatalog("test");
  expect(workspace.getCatalogVersion("test", "package")).toBeUndefined();
  expect(workspace.listCatalogs()).toEqual([]);
});

it("should track packages across catalogs", () => {
  const workspace = parseBunWorkspace(JSON.stringify({ workspaces: {} }));

  workspace.setPackage("default", "pkg1", "1.0.0");
  workspace.setPackage("catalog1", "pkg1", "2.0.0");
  workspace.setPackage("catalog2", "pkg1", "3.0.0");

  expect(workspace.getPackageCatalogs("pkg1")).toEqual([
    "catalog1",
    "catalog2",
    "default",
  ]);

  expect(workspace.getCatalogPackages("catalog1")).toEqual({ pkg1: "2.0.0" });
  expect(workspace.getCatalogPackages("catalog2")).toEqual({ pkg1: "3.0.0" });
  expect(workspace.getCatalogPackages("default")).toEqual({ pkg1: "1.0.0" });
});

it("should handle workspace content management", () => {
  const workspace = parseBunWorkspace(JSON.stringify({ workspaces: {} }));

  const newContent = {
    workspaces: {
      catalog: { test: "1.0.0" },
    },
  };

  workspace.setContent(newContent);
  expect(workspace.getContent()).toEqual(newContent);
  expect(workspace.hasChanged()).toBe(true);
  expect(workspace.getCatalogVersion("default", "test")).toBe("1.0.0");
  expect(workspace.listCatalogs()).toEqual(["default"]);
});

it("should ensure workspaces initialization", () => {
  const workspace = parseBunWorkspace("{}");

  workspace.setPackage("default", "pkg1", "1.0.0");
  expect(workspace.getContent()).toEqual({
    workspaces: {
      catalog: {
        pkg1: "1.0.0",
      },
    },
  });
});

it("should handle default catalog removal", () => {
  const input = {
    workspaces: {
      catalog: {
        pkg1: "1.0.0",
      },
    },
  };

  const workspace = parseBunWorkspace(JSON.stringify(input));
  workspace.removeCatalog("default");

  expect(workspace.getContent()).toEqual({
    workspaces: {},
  });
  expect(workspace.hasChanged()).toBe(true);
});

it("should handle non-existent catalog removal", () => {
  const workspace = parseBunWorkspace(JSON.stringify({ workspaces: {} }));

  workspace.removeCatalog("nonexistent");

  expect(workspace.getContent()).toEqual({
    workspaces: {},
  });
  expect(workspace.hasChanged()).toBe(false);
});

it("should initialize catalogs when setting package", () => {
  const workspace = parseBunWorkspace(JSON.stringify({ workspaces: {} }));

  workspace.setPackage("test", "pkg1", "1.0.0");

  expect(workspace.getContent()).toEqual({
    workspaces: {
      catalogs: {
        test: {
          pkg1: "1.0.0",
        },
      },
    },
  });
});
