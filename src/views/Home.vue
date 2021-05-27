<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import { getSheet, editSheet } from '../plugin/google-sheet.js'

export default {
  name: 'Home',
  components: {
    HelloWorld
  },
  data() {
    return {
      input1: 'aa',
      submitData: {
        data1: '',
        data2: '',
        data3: '',
        data4: '',
        data5: '',
        data6: '',
        data7: ''
      },
      headerList: [],
      data: '',
      loadingEditData: false
    }
  },
  mounted() {
    this.getData();

  },
  methods: {
    async getData() {
      const sheet = await getSheet();

      this.data = sheet.map((item, index) => {
        this.submitData[`data${index + 1}`] = item._rawData[1];
        this.headerList[index] = item._rawData[0];
        this.$forceUpdate();
        return item._rawData
      });
    },
    async editData(value, index) {
      if(value && Number(value)) {
        this.loadingEditData = true;

        editSheet({
          value,
          cellName: `B${index + 2}`
        })
          .finally(() => {
            this.loadingEditData = false;
          })
      }else {
        this.submitData[`data${index + 1}`] = '';
      }
    }
  }
}
</script>
<template>
  <div :class="$style.home" class="home py-5">
    <div class="container text-left">
      <div class="row py-3">
        <div class="col-1">
          <i class="fad fa-user-tag fa-2x"></i>
        </div>
        <div class="col-11">
          <i class="fad fa-head-side-cough mr-2 fa-2x"></i>
          <i class="fad fa-disease mr-1 fa-lg"></i>
          <i class="fad fa-viruses mr-1 fa-lg"></i>
          <i class="fad fa-bacteria mr-1 fa-lg"></i>
        </div>
      </div>
      <div
        v-for="(header, index) in headerList"
        :key="index"
        class="row align-items-center py-2"
      >
        <div class="col-1">
          <span style="font-size: 2rem">{{ header }}</span>
        </div>
        <div class="col-11">
          <el-input
            v-model.number="submitData[`data${index + 1}`]"
            placeholder="請輸入.."
            class="isStyleBase"
            autocomplete="tel"
            inputmode="tel"
            @blur="editData(submitData[`data${index + 1}`], index)"
          >
          </el-input>
        </div>
      </div>
      <div class="home__loading" v-if="loadingEditData">
        <i class="fad fa-circle-notch fa-spin mr-2"></i>儲存中 ...
      </div>
    </div>
    <pre>

    </pre>
  </div>
</template>

<style lang="scss" module>
  .home {
    :global {
      .home {
        &__loading {
          position: fixed;
          right: 1rem;
          bottom: 1rem;
        }
      }
    }
  }
</style>
