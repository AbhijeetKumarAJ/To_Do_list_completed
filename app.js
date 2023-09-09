require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");
mongoose.connect(process.env.CONNECT_MONGODB,{useNewUrlParser:true});

const itemsSchema={
    name:String
};

const Item=mongoose.model("Item",itemsSchema);

const item1= new Item({
    name:"Welcome to your To DoL ist!"
});
const item2= new Item({
    name:"Hit the + button to add a new item"
});
const item3= new Item({
    name:"<-- Hit this to delete item"
});

const defaultItems=[item1,item2,item3];

const listSchema={
    name:String,
    items:[itemsSchema]
};      
const List=mongoose.model("List",listSchema);

// Item.insertMany(defaultItems);

const app=express();
const items=["Buy Food","Cook Food","Eat Food"];
const workItems=[];
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

async function getItems(){

    const Items = await Item.find({});
    return Items;
  
}

app.get("/",function(req,res){
    
    getItems().then(function(FoundItems){
        if(FoundItems.length==0){
            Item.insertMany(defaultItems);
            res.redirect("/");
        };
        res.render("list",{listTitle:"Today",newListItems:FoundItems});
    });
    
}); 

app.get("/:customListName",(req,res)=>{
    const customListName=_.capitalize(req.params.customListName);
    List.findOne({name:customListName}).then(function(foundList){
        if(!foundList){
            //new list is created;
            const list=new List({
                name:customListName,
                items:defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        }
        else{
            res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
        }

    })
    .catch(function (err) {
      console.log(err);
    });
})

app.post("/",function(req,res){
    const itemName =req.body.newItem;
    const listName=req.body.list;
    const item= new Item({
        name:itemName
    });
    if(listName==="Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
    
    // if(req.body.list==="Work"){
    //     workItems.push(item);
    //     res.redirect("/work");
    // }else{
    //     items.push(item);
    //     res.redirect("/");
    // }
});


app.post("/delete", function(req, res){
 
    const checkedItemId = req.body.checkbox.trim();
    const listName = req.body.listName;
   
    if(listName === "Today") {
   
      Item.findByIdAndRemove(checkedItemId).then(function(foundItem){Item.deleteOne({_id: checkedItemId})})
   
      res.redirect("/");
   
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function (foundList)
        {
          res.redirect("/" + listName);
        });
    }
   
  });
app.post("/delete",async(req,res)=>{
    const checkedItemid =req.body.checkbox;
    const listName=req.body.listName;

    // console.log(checkedItemid);
    if(listName==="Today"){
        const data=await Item.findByIdAndRemove(checkedItemid);
    res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemid}}});
        res.redirect("/"+listName);
    }
    
});

// app.get("/work",function(req,res){
//     res.render("list",{listTitle:"Work List",newListItems:workItems});
// });

// app.post("/work",function(req,res){
//     const item=req.body.newItem;
//     workItems.push(item);
//     res.redirect("/work");
// });


app.get("/about",function(req,res){
    res.render("about");
})

app.listen(3000,function(){
    console.log("Server started on port 3000");
}); 